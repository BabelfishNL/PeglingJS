"use strict";

const Pegling = (function() {
	var cg={};
	const pegRules = {
		grammar: [ast=>ast.reduce((a,v)=>{a[v[1]]=v[2]; return a;},{}),
				   ['+',[ast=>['cat',ast[1][0][1],ast[1][3]],
					['#',['cat',['var','nonterminal'],
						['span','<-'],
						['var','sp'],
						['var','pattern']]]]]],
		pattern:  [ast=>ast[1][1][1].length==0?ast[1][0]:ast[1][1][1].reduce((a,v)=>{a.push(v[1][2]); return a;},['/',ast[1][0]]),
					['cat', ['var','alternative'],['*',['cat',['span','/'],['var','sp'],['var','alternative']]]]],
		alternative: [ast=>ast.length>=2?['cat'].concat(ast):ast[0],
						['+',
						[ast=>ast[1][0].length>1?[ast[1][0][1],ast[1][2]]:ast[1][2],
							['cat',['?',['cc','!&#^']],['var','sp'],['var','suffix']]]]],
		suffix: [ast=>ast[1][1][1].reduce((a,v)=>[v[1][0][1],a],ast[1][0]),
					['cat',['var','primary'],['*',['cat',['cc','*+?'],['var','sp']]]]],
		primary: ['/',
					  [ast=>ast[1][2],
							['cat',['span','('],['var','sp'],['var','pattern'],
									['var','sp'],['span',')'],['var','sp']]],
					  [(ast)=>['.'],
							['cat',['span','.'],['var','sp']]],
					  ['var','literal'],
					  ['var','charclass'],
					  [ast=>[ast[1][0],ast[1][3]],
							['cat', ['var','code'],['span','('],['var','sp'],['var','pattern'],
									['span',')'],['var','sp']]],
					  [ast=>['var',ast[1][0][1]],
							['cat',['var','nonterminal'],['!',['span','<-']]]]],
		literal: [ast=>['span',ast[1][1][1].reduce((a,v)=>a+v[1][1][1],'')],
					['cat',	['span',"'"],
							['*',['cat',['!',['span',"'"]],['.']]],
							['span',"'"],
							['var','sp']]],
		charclass: [ast=>['cc',ast[1][2][1].reduce((a,v)=>
			v[1][1][1]instanceof Array?a+v[1][1][1][0][1]+'-'+v[1][1][1][2][1]:a+v[1][1][1],
				ast[1][1].length>1?'\]':'')],
					['cat',	['span','['],
							['?', ['span',']']],
							['*',['cat',['!',['span',']']],
										['/',['cat',['.'],['span','-'],['.']],['.']]]],
							['span',']'],
							['var','sp']]],
		nonterminal: [ast=>['@nt',ast[1][0].reduce((a,v)=>a+v[1],'')],
				  ['cat',['+',['cc','a-zA-Z']],['var','sp']]],
		code: [ast=>{const f=ast[1][1][1].reduce((a,v)=>a+v[1][1][1],'');
					 return cg.hasOwnProperty(f)?cg[f]:eval(f)},
				['cat',['span','{{'],['*',['cat',['!',['span','}}']],['.']]],['span','}}'],['var','sp']]],
		sp: [ast=>[],
			 ['*',['cc',' \t\n']]]
	}
	function prime(rules, logging=[]) {
		let here, logs=logging.reduce((a,v)=>{a[v]=true; return a;},{})
		function rdi(inp,idx,pat) {
			log('at',inp,idx,inp.substr(idx).split('\n')[0],pat)
			//console.log('at',inp,idx,inp.substr(idx).split('\n')[0],pat)
			let inpLen = inp.length;
			if (idx>inpLen) return [-1,'eof'];
			switch (pat[0]) {
				case 'var': {
						log('*nt',inp,idx,inp.substr(idx).split('\n')[0],pat);
						here.push(pat[1]);
						let v = rdi(inp,idx,rules[pat[1]]);
						here.pop();
						return log('nt*',inp,idx,v,pat);
					}
					break;
				case 'cat': {
						let res=[];
						for (let i=1; i<pat.length; i++) {
							let x = rdi(inp,idx,pat[i]),
								[ idxn, ast ] = x;
							if (idxn>=idx) {
								idx = idxn; 
								res.push(ast);
							} else {
								return [-1,[pat[0],i,idx,res,ast]]
							}
						}
						return log('.cat',inp,idx,[idx,['#cat',res]]);
					}
					break;
				case '/': {
						for (let i=1; i<pat.length; i++) {
							let x = rdi(inp,idx,pat[i]),
								[ idxn, ast ]=x;
							if (idxn>=idx) {
								let v = [idxn,ast]
								return log('./',inp,idx,v);
							}
						}
						return [-1,[pat[0],['#/',idx]]];
					}
					break;
				case '+': {
						let res=[];
						let [ idxn, ast ]=rdi(inp,idx,pat[1]);
						if (idxn>=idx) {
							do {
								idx=idxn; res.push(ast)
								let x = rdi(inp,idx,pat[1]);
								[ idxn, ast ]=x;
							} while (idxn>idx);
							return log('+',inp,idx,[idx,res]);
						} else {
							return [-1,[pat[0],idx,['#+',ast]]];
						}
					}
					break;
				case '*': {
						let res=[];
						let [ idxn, ast ]=rdi(inp,idx,pat[1])
						while (idxn>=idx) {
							idx=idxn; res.push(ast)
							let x = rdi(inp,idx,pat[1]);
							[ idxn, ast ] = x;
						}
						return log('*',inp,idx,[idx,['#*',res]]);
					}
					break;
				case '?': {
						let [ idxn, ast ]=rdi(inp,idx,pat[1]);
						return log('?',inp,idx,idxn>idx 
							? [idxn, ast] 
							: [idx,['#?']]);
					}
					break;
				case '^': {
						let [ idxn, ast ]=rdi(inp,idx,pat[1]);
						return log('^',inp,idx,idxn>idx 
							? [idxn, ast] 
							: [-1,[pat[0],idx,inp.substring(idx,idxn),ast,pat[1]]]);
					}
					break;
				case '&': {
						let [ idxn, ast ]=rdi(inp,idx,pat[1]);
						return log('&',inp,idx,idxn>idx 
							? [idx,['#&']] 
							: [-1,[pat[0],idx,inp.substring(idx,idxn),ast,pat[1]]]);
					}
					break;
				case '#': {
						let x = rdi(inp,idx,pat[1]),
							[ idxn, ast ] = x;
						if (idxn<0) return x;
						// add ['log', tag, AST] around AST in rule to log (tag to identify)
						// or set breakpoint below this line to inspect
						log('log',inp,idx,pat[1],pat[2],inp.substring(idx,idxn),ast)
						return x;
					}
					break;
				case '!': {
						let [ idxn, ast ]=rdi(inp,idx,pat[1]);
						return log('!',inp,idx,idxn>idx 
							? [-1,[pat[0],idx,inp.substring(idx,idxn),ast,pat[1]]] 
							: [idx,['#!']]);
					}
					break;
				case 'cc': {
						let re = new RegExp('['+pat[1].replace(']','\\]')+']'),
							str = inp[idx];
						return log('cc',inp,idx,re.test(str) && idx <= inpLen
							? [idx+1,['#cc',str]]
							: [-1,[pat[0],idx,str,pat[1]]]);
					}
					break;
				case '.':
					return  log('.',inp,idx,idx <= inpLen
						? [idx+1,['#.',inp[idx]]]
						: [-1,[pat[0],idx,inp[idx]]]);
					break;
				case 'span': {
						let len = pat[1].length,
							str = inp.substr(idx,len);
						return log('span',inp,idx,str===pat[1] && idx+len <= inpLen
							? [idx+len, ['#span',str]]
							: [-1, [pat[0],idx,str,pat[1]]]);
					}
					break;
				default: {
					let f = pat[0];
					switch (typeof f) {
					case 'function':
						let x = rdi(inp,idx,pat[1]),
							[ idxn, ast ] = x;
						if (idxn<0) return x;
						return log('fun',inp,idx,[idxn,f(ast)],f,here);
					case 'string':
						console.error('unknown code "'+f+'"');
		}	}	}	}
		
		function log(tag,inp,idx,v,...a) {
			switch (tag) {
				case 'at': if (logs.attempts) {
					console.log(v,...a);
				} return null;
				case '*nt': if (logs.nonterminals) {
					let nt=a[0][1];
					console.log(String(here.length).padStart(3, '0')+"%"+"  ".repeat(here.length), tag,nt,v,here,'[',inp.substr(idx).split('\n')[0],']');
				} return null;
				case 'nt*': if (logs.nonterminals) {
					let nt=a[0][1];
					if (v[0]!==-1) {
						console.log(String(here.length).padStart(3, '0')+"%"+"  ".repeat(here.length), tag,nt,v,here,'[',inp.substr(idx).split('\n')[0],']');
					}
				} break;
				case 'cat': case '/': case '+': case '*': case '?': case '&': 
				case '!': case 'cc': case '.': case 'span': 
				if (logs.engine) {
					console.log(tag,' -> ',v);
				} break;
				case 'log':  if (logs.mylogs) {
					let [pat,str,ast] = a;
					console.log(tag+' '+v+' str: %c'+str,'background: #ddd;');
					console.log('ast:',ast);
				} break;
				case 'fun':  if (logs.myfuns) {
					let [f,h] = a;
					console.log(tag,f,' ~~> ',v[1],'in',h);
				} break;
			}
			return v;
		}

		return function(inp,rootid) {
			here = [];
			let res = rdi(inp,0,rules[rootid])[1]
			return res;
		}
	}
	let pegc = prime(pegRules),			// X.peg => ( X.src => X.rules )
		mkPhase1 = function (logs,codegen) {  		// logs => src => compile(src)
			let pc = logs&&logs.length>0 ? prime(pegRules,logs) : pegc;
			return src => 
				{ cg=codegen; const res = pc(src,'grammar'); cg = {}; return res; }
		},
		mkXpiler = function (src,codegen,cmpLogs,trgtLogs) {
			let ph1 = mkPhase1(cmpLogs,codegen);
			return prime(ph1(src),trgtLogs);
		}
	return {
		pegRules:pegRules, // PEG compiler-generator rules
		prime:prime, // rules => compiler (= txt => code)
		mkPhase1:mkPhase1, // X.src => X.rules
		mkXpiler:mkXpiler // X.src => ( X.txt => X.ast)
	}
}())



