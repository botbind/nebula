interface Options {
  foo?: string;
  answer?: number,
  aMethod?: (a:string) => string;
}

class Foo {
	options: Options;
	constructor(options:Options) {
		this.options = {
		    foo: 'bar',
		    answer: 42,
		    aMethod: undefined,
		};
		Object.assign(this.options, options);
	}

	test() {
		
	}
}
var foo1 = new Foo({});
console.log("foo1: foo", foo1.options.foo); // 'bar'
console.log("foo1: answer", foo1.options.answer); // 42
console.log("foo1: aMethod", foo1.options.aMethod); // function()
var foo2 = new Foo({answer: 0, aMethod: (a:string) => { return a; } );
console.log("foo2: foo", foo2.options.foo); // 'bar'
console.log("foo2: answer", foo2.options.answer); // 0
console.log("foo2: aMethod", foo2.options.aMethod); // function(a)
