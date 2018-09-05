###  背景

网上讲述redux的文章实在是太多了， 多到很多有经验的程序员已经无法体会新手程序员初次接触redux时的纠结， 至少我第一次接触redux的时候， 内心的崩溃的， 这到底是神马？ 一会儿store， 一会儿reducer， 一会儿react-redux，为什么要搞这么复杂呢。 而且， 很多博客实例代码， 是以脚手架模块化的方式展示的， 谁能告诉我如何先搭建一个可以运行redux的集成环境（哭...）， 然后说一下如何安装redux， 然后讲redux是什么， redux的数据流运行流程？

为什么在面对这么多热心分享的博客， 我当时依然是懵逼的呢？ 后来总结了一下， 发现至少有两个方面的原因：

1. 很多博主在写博客的时候， 忽略了很多默认读者已经掌握的知识，比如脚手架， redux安装，但事实并不是这样， 恰恰是这些前置知识拦住了初学者的步伐（找一个集成redux的项目脚手架当时真的好难啊）。
2. 很多博主有关redux的文章是从已经掌握redux或者已经理解了redux设计理念的视角来总结学习经验的， 但初学者缺乏的恰恰是如何从jq， 从原生js过度到理解并体会redux理念视角的过程， 从这个角度来写的博客非常少。但这是初学者最容易理解和接受的方式。

所以问题出来了： 能不能抛开脚手架谈redux， 能不能从最直观初始的起点（传统数据流管理）逐步过渡到redux（单一数据流管理）， 这就是我写这篇学习总结的出发点。

### 小demo

接下来从一个最最简单的demo开始， 看传统的数据流是一步一步往redux过渡的， 以及这么过渡是出于什么样的考量：

```
<!DOCTYPE html>
<html>
<head>
	<title>	redux-abc </title>
	<script src="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.8.0.js"></script>
</head>
<body>
	<div>
		<button id="add">+</button>
		<button id="sub">-</button>
		<div id="show"></div>
	</div>
<script>
	var count = 0;

	var add = $('#add');
	var sub = $('#sub');
	var show = $('#show');

	add.click(() => {
		count ++;
		render()
	})

	sub.click(() => {
		count --;
		render()
	})

	function render () {
		show.text(count);
	}

	render();
</script>
</body>
</html>
```
这段代码的功能比较简单， 就是两个按钮， 点击'+', 数字加一， 点击'-', 数字减一。 

实现这么一个小的功能， 需要维护两个程序对象： 动作(鼠标的两类点击动作)和状态(count)。

这样写有什么问题呢？ 

当页面业务比较复杂， 交互丰富起来后， 会发现有非常多的动作需要监控， 同时有很多的状态需要维护， 当动作和状态交叉作， 状态， 动作， 状态变更深度耦合， 项目的维护成本快速增长。


### redux的解决思路

redux的解决思路是： 状态统一管理， 动作纯粹是动作， 跟状态完全分离， 动作与状态转移之间通过纯函数进行映射， 原来动作直接触发对应状态（数据）更新的流程变成了 统一管理状态 -> 传递动作 -> 返回新状态, 一切就变得有序可控了。

按照这个思路对源程序进行修改一下

```
var count = 0;
var add = $('#add');
var sub = $('#sub');
var show = $('#show');
// 统一action
var ADD = {type: 'ADD'};
var SUB = {type: 'SUB'};
// count根据action的不同动态映射新的count
function change (count, action) {
	if(action.type === 'ADD') {
		return ++ count
	} else if(action.type === 'SUB') {
		return -- count
	} else {
		return count
	}
}

add.click(() => {
	update(ADD)
})

sub.click(() => {
	update(SUB);
})

function update (action) {
	count = change(count, action);
	render(count);
}

function render (count) {
	show.text(count);
}

render(count);
```

### 代码优化

其实到这里redux的基本思路已经讲明白了， 但这种代码结构非常丑陋， 可以对其进行优化， 结合原生redux的api，写一个小的redux库， 暂时叫fakeRedux， 然后适用我们的fakeRedux改造一下这个小的计数器demo；

最终想要达到的效果是这样的

```
// store维护状态， 同时集成reducer（就是现在的change函数）
var store = createStore(reducer);
// 提供dispatch 方法，触发reducer分支， 改变state
store.dispatch(action);
// render函数订阅store， 实现dispatch的自动更新
store.subscribe(render);
```

为此， 这里单独创建fakeReducer.js管理工具库

```
function createStore (reducer, initState) {
	let currentState = initState;
	let currentReducer = reducer;
	let listeners = [];

	function getState () {
		return currentState;
	}

	function dispatch (action) {
		currentState = currentReducer(currentState, action);
		for(let i = 0; i < listeners.length; ++i) {
			listeners[i]();
		}
	}

	function subscribe (listener) {
		listeners.push(listener);
		return function (listener) {
			unSubscribe(listener);
		}
	}

	function unsubscribe(listener) {
		let index = listeners.indexOf(listener);
		listeners.splice(index, 1);
	}

	return {
		getState,
		dispatch,
		subscribe
	}
}
```

然后适用fakeReducer对原有的计数器代码进行改造一番：

```
var count = 0;
var add = $('#add');
var sub = $('#sub');
var show = $('#show');
// 统一action
var ADD = {type: 'ADD'};
var SUB = {type: 'SUB'};
// count根据action的不同动态映射新的count, 也就是reducer了
function change (count, action) {
	if(action.type === 'ADD') {
		return ++ count
	} else if(action.type === 'SUB') {
		return -- count
	} else {
		return count
	}
}

var store = createStore(change, count);

add.click(() => {
	store.dispatch(ADD);
})

sub.click(() => {
	store.dispatch(SUB);
})

store.subscribe(render);

function render () {
	let count = store.getState();
	show.text(count);
}

//初始化
render();
```

到现在， 一个非常简陋的reducer已经实现了， 说简陋是因为还没有增强实现enhancer的功能， 也不支持中间件， 没有考虑足够多的边界条件， 也没有测试代码， 这一部分后续完善。 但从原理上来讲， 已经实现了文章的初衷： 用最简单的方法， 理解reducer的逻辑。

但这还不够， 接下来要做的是把这个简陋的fakeReducer发布成公共模块， 然后把它作为依赖，在集成开发环境中适用（对的， 就是模块化开发了）

### 把fakeReducer发布成公共模块

- 在github创建[fake-reducer项目](https://github.com/fridego/fake-reducer)

- clone到本地后， 初始化npm项目

```
{
  "name": "fake-reducer",
  "version": "1.0.2",
  "description": "fake reducer",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/fridego/fake-reducer.git"
  },
  "keywords": [
    "fake-reducer"
  ],
  "author": "fridego",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/fridego/fake-reducer/issues"
  },
  "homepage": "https://github.com/fridego/fake-reducer#readme"
}

```

- 创建入口文件 index.js

```
// index.js

function createStore (reducer, initState) {
	let currentState = initState;
	let currentReducer = reducer;
	let listeners = [];

	function getState () {
		return currentState;
	}

	function dispatch (action) {
		currentState = currentReducer(currentState, action);
		for(let i = 0; i < listeners.length; ++i) {
			listeners[i]();
		}
	}

	function subscribe (listener) {
		listeners.push(listener);
		return function (listener) {
			unSubscribe(listener);
		}
	}

	function unsubscribe(listener) {
		let index = listeners.indexOf(listener);
		listeners.splice(index, 1);
	}

	return {
		getState,
		dispatch,
		subscribe
	}
}

module.exports = createStore;
```

- 在[npm官网](www.npmjs.com)创建账户 

- 本地登陆

```
npm adduser
```

- 上传源码到github

```
git add .
git commit -m 'init'
git push
```

- 发布npm包

```
npm publish
```

- 查看包

```
//命令行运行：
npm view fake-reducer

就可以看到刚刚发布的fake-reducer包了

fake-reducer@1.0.2 | MIT | deps: none | versions: 3
fake reducer
https://github.com/fridego/fake-reducer#readme

keywords: fake-reducer

dist
.tarball https://registry.npmjs.org/fake-reducer/-/fake-reducer-1.0.2.tgz
.shasum: dfc9179f1e2b11568e4dedb9f194f0f813261c6e
.integrity: sha512-kY1+WLt4Ko9i7gy4yOgbHI/uH/8o15DmrAMgrhp1s3Lu5FGkREEn4xG5HsyQCGDbvtc9H7oI9/MydIUeosrdhw==
.unpackedSize: 1.2 kB

maintainers:
- fridego <hellofridego@gmail.com>

dist-tags:
latest: 1.0.2

```

- 在项目中适用

```
npm install fake-reducer --save
```

### 添加拓展功能

- enhencer

enhencer 是redux的增强， 是一个高阶函数， 相当于在createStore函数返回对象添加一层， 你可以对createStore的返回对象做任意修改
```
	getState,
	dispatch,
	subscribe 
```
比如想做一个打印action的logger
```
function loggerEnhencer (createStore) {
	return function (reducer, initState) {
		let store = createStore(reducer, initState);
		function dispatch (action) {
			console.log(`dispatching an action : ${JSON.stringify(action)}`);
			const res = store.dispatch(action);
			const newState = store.getState();
			console.log(`current state : ${JSON.stringify(newState)}`);
			return res;
		}
		return {
			...store,
			dispatch
		}
	}
}
```
这里相当于对dispatch进行增强， 其实还可以对subscribe, store等进行增强

使用方法如下：

```
var store = createStore(change, count, loggerEnhencer);
```

- middleware


### 项目地址

[fake-reducer](https://github.com/fridego/fake-reducer)
[fake-redux-logger](https://github.com/fridego/fake-redux-enhercer-logger)











