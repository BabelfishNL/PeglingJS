"use strict";

document.getElementById('fileInput').addEventListener("change", readFile);

console.log(`
Test 2: Parse JSON file.
Please click "Choose file"
`);


let jsonPeg = `element <- {{element}}(wh value wh)
value <- object / array / string / number / {{constant}}('true' / 'false' / 'null')
object <- {{members}}('{' ( wh member (wh ',' wh member)* )? wh '}' wh)
member <- {{member}}(string wh ':' wh value)
array <- {{values}}('[' ( wh value (wh ',' wh value)* )? wh ']' wh)
string <- {{str}}('"' character* '"')
character <- {{character}}(
	'\\' (["\\/bfnrt] / 'u' [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F]) / !'"' .)
number <- {{number}}(integer fraction? exponent?)
integer <- {{integer}}('-'? ('0' / [1-9] [0-9]*))
fraction <- {{fraction}}('.' [0-9]+)
exponent <- {{exponent}}([eE] [-+]? [0-9]+)
wh <- {{wh}}([ \t\n\r]*)		
`
const cg={
	wh: x => [],
	character: x => x[1][0].length===1||x[1][1][0]==='#cc'?x[1][1][1]:
	String.fromCharCode(parseInt('0x'+
		x[1][1][1][1][1]+x[1][1][1][2][1]+x[1][1][1][3][1]+x[1][1][1][4][1])),
	str: x => x[1][1][1].join(''),
	element: x =>  x[1][1],
	values: x => x[1][1].length===1?[]:
		x[1][1][1][2][1].reduce((a,v)=>{a.push(v[1][3]); return a;},[x[1][1][1][1]]),
	members: x => {let o={}; if (x[1][1].length===1) return o; 
		o[x[1][1][1][1][0]]=x[1][1][1][1][1];
		x[1][1][1][2][1].reduce((a,v)=>{a[v[1][3][0]]=v[1][3][1]; return a;},o); return o;},
	member: x => [x[1][0],x[1][4]],
	constant: x => x[1],
	integer: x => {let r = x[1][0].length>1?'-':''; r+=x[1][1][1]==='0'?
		'0':x[1][1][1][1][1].reduce((a,v)=>a+v[1],x[1][1][1][0][1]); return r;},
	fraction: x => x[1][1].reduce((a,v)=>a+v[1],''),
	exponent: x => x[1][0][1]+x[1][1][1]+x[1][2].reduce((a,v)=>a+v[1],''),
	number: x => Number(x[1][0]+
		(typeof x[1][1]==='string'?'.'+x[1][1]:'')+
		(typeof x[1][2]==='string'?x[1][2]:''))
} 

function readFile(event) {
	const file = event.target.files[0],
		reader = new FileReader(),
		jsonParser = Pegling.mkXpiler(jsonPeg,cg);
		
	reader.onload = function(){
		var txt = reader.result;
		
		console.log(jsonParser(txt,'element'));
    };
    reader.readAsText(file);
}
