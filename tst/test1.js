"use strict";

let txt = `grammar <-  {{ast=>ast.reduce((a,v)=>{a[v[1]]=v[2]; return a;},{})}}
										(
					#{{ast=>['cat',ast[1][0][1],ast[1][3]]}}
											(nonterminal '<-' sp pattern)+
										)  
	pattern <-  {{ast=>ast[1][1][1].length==0?ast[1][0]:ast[1][1][1].reduce((a,v)=>{a.push(v[1][2]); return a;},['/',ast[1][0]])}}
										(alternative ('/' sp alternative)*)
	alternative <-  {{ast=>ast.length>=2?['cat'].concat(ast):ast[0]}}
										(	
					{{ast=>ast[1][0].length>1?[ast[1][0][1],ast[1][2]]:ast[1][2]}}
											([!&#]? sp suffix)+
										)
	suffix <-  {{ast=>ast[1][1][1].reduce((a,v)=>[v[1][0][1],a],ast[1][0])}}
										(primary ([*+?] sp)*)
	primary <- 
		{{ast=>ast[1][2]}}				('(' sp pattern sp ')'  sp) /
		{{(ast)=>['.']}}				('.' sp) /
		literal /
		charclass /
		{{ast=>[ast[1][0],ast[1][3]]}}	(code '(' sp pattern ')'  sp) /
		{{ast=>['var',ast[1][0][1]]}} 	(nonterminal !'<-')
	literal <- {{ast=>['span',ast[1][1][1].reduce((a,v)=>a+v[1][1][1],'')]}}
										(['] (!['] .)* ['] sp)
	charclass <- {{ast=>['cc',ast[1][2][1].reduce((a,v)=>
			v[1][1][1]instanceof Array?a+v[1][1][1][0][1]+'-'+v[1][1][1][2][1]:a+v[1][1][1],'')]}}
										('[' ']'? (!']' (. '-' . / .))* ']' sp)
	nonterminal <- {{ast=>['@nt',ast[1][0].reduce((a,v)=>a+v[1],'')]}}
										([a-zA-Z]+ sp)
	code <- {{ast=>eval(ast[1][1][1].reduce((a,v)=>a+v[1][1][1],''))}}
										('{{' (!'}}' .)* '}}' sp)
	sp <-  {{ast=>[]}}
										([ \t\n]*)
`
let rules = Pegling.pegRules;

/****************************\
**          Test 1.1          **
\****************************/

{	console.log(`
	Test 1.1: print three values
		* Handcrafted grammar/parser 'Pegling.pegRules'
		* The result (*) of parsing the input in variable 'txt' (should be nearly the same, see Test 2)
		* The result of parsing the input in variable 'txt' using the parser (*)\n
	`);

	
	console.log(rules)
	let myMkPhase1 = Pegling.prime(rules),
		myPegRules = myMkPhase1(txt,'grammar')
	console.log(myPegRules)
	let myMkPhase1_2 = Pegling.prime(myPegRules),
		myPegRules_2 = myMkPhase1_2(txt,'grammar')
	console.log(myPegRules_2)
}

/****************************\
**          Test 1.2          **
\****************************/

{	console.log(`
	Test 1.2: parse while printing generic differences log
	Expected differences: generated 'txt' uses 'span' in three places where handcrafted 'rules' uses 'cc' (for a single character c, 'c' and [c] parse the same).\n
	Added to that any extensions/alterations after V1 (e.g. log #).\n
	`);

	function compare(p, r, x, y) {
		if (x === y||typeof x === 'function' && typeof y === 'function') {
			return;
		} else if (!(x instanceof Array) || !(y instanceof Array) 
				   || Object.keys(x).length != Object.keys(y).length) {
			console.log('dif',p,r,x,y);
		} else {
			for (var prop in x) {
				if (y.hasOwnProperty(prop)) {  
					p.push(prop)
					compare(p,r,x[prop], y[prop])
					p.pop()
				} else {
					console.log('dif',p,r,x,y);
					return;
				}
			}
		}
	}

	rules.grammar = [ast=>ast.reduce((a,v)=>{a[v[1]]=v[2]; compare([],v[1],v[2],rules[v[1]]); return a;},{}),
				   ['+',[ast=>['cat',ast[1][0][1],ast[1][3]],
					['cat',['var','nonterminal'],
						['span','<-'],
						['var','sp'],
						['var','pattern']]]]]

	let comparingMkPhase1 = Pegling.prime(rules),
		_ = comparingMkPhase1(txt,'grammar')
}

/****************************\
**          Test 1.3          **
\****************************/

{	console.log(`
	Test 1.3: print tree before (1) and after (2) transformation from parse tree to abstract syntax tree.\n
	`);

	rules.grammar = [ast=>ast.reduce((a,v)=>{a[v[1]]=v[2]; return a;},{}),
				   ['+',['#',[ast=>['cat',ast[1][0][1],ast[1][3]],
					['#',['cat',['var','nonterminal'],
						['span','<-'],
						['var','sp'],
						['var','pattern']]]]]]]

	let inspectingMkPhase1 = Pegling.prime(rules,['mylogs']),
		_ = inspectingMkPhase1(txt,'grammar')
}


