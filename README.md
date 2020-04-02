# PeglingJS

## Contents
```
1. Introduction
	1.1. Technology
	1.2. Installation & Use
	1.3. Features
	1.4. Tests
	1.5. Contribute
	1.6. Credits & License
2. PEG
	2.1. Example
3. Files
4. References
5. User Manual
	5.1. Example usage:
	5.2. Creating PeglingJS Parsers
6. Technical Manual
		6.1.1. `Pegling.parser`
		6.1.2. A Generated Parser
		6.1.3. `Pegling.rdp`
		6.1.4. `rdi` (internal)
		6.1.5. `Pegling.pegRules`, `Pegling.pegParser`
	6.2. Rules
	6.3. Instructions
```

## 1. Introduction

PeglingJS is a parser-generator based on Parsing Expression Grammars (PEG's [1]). PEG's offer an efficient way of defining languages and parsers. 

PeglingJS is incredibly compact (7Kb source, 4Kb minified). PeglingJS is created in the context of the development of another parser generator based on [2], and as such several disadvantages of PeglingJS are accepted for the moment:

* PeglingJS uses recursive descent parsers, which are notoriously inefficient and difficult to debug
* PeglingJS parsers aren't particularly fast (400 KB, 13.000 lines of JSON parse in 13 minutes), but they are effective and efficient for small inputs.
* PeglingJS parsers are recursive and therefore limited by the JavaScript stack. In practice this isn't a limitation.
* PeglingJS offers various logging/tracing capabilities, but:
	* parser error-reporting is limited
	* grammar debugging is difficult

### 1.1 Technology
PeglingJS is written entirely in plain JavaScript. It uses several ES6 features.

### 1.2 Installation & Use

* Download or clone into the repository
* Include the <script src = "pegling.min.js" type = "text/javascript"/></script>
* This creates the global object `Pegling`. See section 'Technical Manual' for further instructions

### 1.3 Features

PeglingJS creates parsers (implemented in JavaScript) for languages defined with Parsing Expression Grammars. A developer can attribute the grammar with code to create abstract syntax trees, other datastructures, or direct interpretation.

### 1.4 Tests

Directory `tst` includes a HTML file which imports two JavaScript files which run tests (and produce output in the browser console.

### 1.5 Contribute
1. Fork it (<https://github.com/yourname/yourproject/fork>)
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request

### 1.6 Credits & License

(c) 2019, Pum Walters, Babelfish  
Pum Walters – [@PumWalters](https://twitter.com/PumWalters) – pum@babelfish.nl


Released under [MIT](https://choosealicense.com/licenses/mit/) license

## 2. PEG

PeglingJS uses the original PEG operators described in [1] with one extension for code (see below). The operators are:

* (juxtaposition): concatenation
* **/**: choice
* ** * **: iterate zero or more
* ** + **: iterate one or more
* **?**: optional
* **&**: positive lookahead
* **!**: negative lookahead
* **.**: any character
* **[...]**: character class
* **'...'**: literal text

A PEG defines a language by defining a function which accepts texts in that language and rejects other texts. In addition to this, texts are usually processed further, based on the structure as defined by the PEG. But the parse-tree is often not directly suitable to process. Instead one needs 

* an abstract syntax tree (for instance to be processed by a compiler or other component)
* some other data structure
* direct interpretation

PeglingJS accepts Javascript code in PEG rules, which describe the tranformation from the parse-tree to something else. In particular, PeglingJS PEG rules may look like 
```txt
	{{ ... code ... }}( ... PEG ... )
```
where the code defines a function which will be applied to the parse-tree resulting from parsing the PEG.

### 2.1. Example
Below is the grammar of PEG's written as a PEG (taken from [3]). That is, this grammar defines the language it is written in.
```text
	grammar 	<-  non-terminal '<-' sp pattern+ 
	pattern 	<-  alternative ('/' sp alternative)*
	alternative <-  ([!&]? sp suffix)+
	suffix 		<-  primary ([*+?] sp)*
	primary 	<- 	'(' sp pattern sp ')'  sp / 
					'.' sp /
					literal /
					charclass /
					code '(' sp pattern ')'  sp /
					non-terminal !'<-'
	literal 	<- ['] (!['] .)* ['] sp
	charclass 	<- '[' (!']' (. '-' . / .))* ']' sp
	non-terminal <- [a-zA-Z]+ sp
	code 		<- '{{' (!'}}' .)* '}}' sp
	sp 			<-  [ \t\n]*
```

It is quite possible to use this PEG directly to define the PEG language and generate a parser. However, without intervention, that parser will generate *parse-trees* which contain superfluous (for further processing) details. For example, the parse-tree of the whitespace between the fifth and sixth lines of this specification, is (in JSON) `["#*", [["#cc"," "], ["#cc","\n"], ["#cc","\t"], ["#cc","\t"], ["#cc","\t"], ["#cc","\t"]]]` but contains no relevant detail other than that it concerns whitespace.

In order to create abstract syntax trees or other data structures from the parse-trees code snippets are inserted in the PEG rules. For example, the rule for *sp* looks like:
```text
	sp <-  {{ast=>[]}}  ([ \t\n]*)
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↑ PEG for whitespace
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↑ function which transforms any whitespace parse-tree into an empty result

In this manner, PEG rules with appropriate functions, in PeglingJS, transform parse-trees on the fly to other data or actions. 

File `test1.js` in this distribution contains the specification of PEG's which, when parsed by PeglingJS, will result in the same rules that PeglingJS uses to parse PEG's. By inference, applied to any PEG, those rules produce a parser for that language.


## 3. Files

This distribution contains the following files:

* `README.md`:  this documentation
* src/
	* `pegling.js`: the javascript source for the parser generator (PEG parse rules, 50 lines; recursive descent engine, 120 lines, tracing/logging, 20 lines; total, 4KB, 230 lines);
	* `pegling.min.js`: minified version
* tst/
	* `test1.js`: first test file: self-compilation and some logging
	* `test2.js`: JSON PEG and reader (30 lines)
	* `main.html` HTML page for testing
	* `random.json`: large JSON file for testing
	* `random.short.json`: smaller test file

## 4. References

1. Bryan Ford. *Parsing expression grammars: A recognition-based syntactic foundation*. In 31st Symposium on Principles of Programming Languages (POPL’04). ACM, January 2004.
2. Medeiros, Sérgio & Ierusalimschy, Roberto. *A parsing machine for PEGs*. DLS'08: Proceedings of the 2008 Symposium on Dynamic Languages. (2008).
3. Roberto Ierusalimschy. *A Text Pattern-Matching Tool based on Parsing Expression Grammars*. In Software: Practice and Experience. John Willey and Sons. (2008)


## 5. User Manual

PeglingJS exposes an object with four entries:

* `pegRules`, the rules which define the PEG grammar and parsers
* `rdp`, the auxiliary function which given rules returns a parser (not normally used)
* pegParer, the auxiliary function which returns the PEG parser (not normally used)
* `parser`, the function which, given a PEG grammar, returns a parser for that grammar.

### 5.1. Example usage:

```
let txt = ... ,
	myPEG = ... ,
	myparser = Pegling.parser(myPEG),
	ast = myparser(txt,'rootNonterminal'),
	myloggingparser =  Pegling.parser(myPEG,['non-terminals','myfuns']),
	more = myloggingparser(txt,'rootNonterminal')
```

This will return a parser for the given PEG and will apply that parser to the given input. Then it will create another parser which logs certain events (to the Javascript console), namely reduction for entire rules (non-terminals) and for the functions that are included in the PEG.

### 5.2. Creating PeglingJS Parsers

Creating PEG grammars is outside the scope of this document. 

In this section we describe how to create a JSON parser which, given a JSON text, will produce the Javascript object described in that text. The file `test2.js` contains the result of this process. The JSON PEG without code is

```text
	element <- wh value wh
	value <- object / array / string / number / 'true' / 'false' / 'null'
	object <- '{' ( wh member (wh ',' wh member)* )? wh '}' wh
	member <- string wh ':' wh value
	array <- '[' ( wh value (wh ',' wh value)* )? wh ']' wh
	string <- '"' character* '"'
	character <- '\\' (["\\/bfnrt] / 
			'u' [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F]) / !'"' .
	number <- integer fraction? exponent?
	integer <- '-'? ('0' / [1-9] [0-9]*)
	fraction <- '.' [0-9]+
	exponent <- [eE] [-+]? [0-9]+
	wh <- [ \t\n\r]*
```

The process to annotate this with appropriate code snippets can be done in two ways:

* with knowledge of the parser generator, to predict the structure of the ensuing parse-trees;
* interactively, using a debugger.

We describe the second way.

Every PEG expression will lead to a structure (parse-tree) which can be transformed by applying a function to it. The interactive method is as follows:

* Whitespace is easiest because any parse-tree can be dropped. We add a function which returns the empty list for any input:  
`wh <- {{x=>[]}}([ \t\n\r]*)`
* Now, apply a named dummy function `f = x => x` to some expression. E.g., `element <- wh value wh` becomes `element <- {{f}}(wh value wh)`.
* In a debugger place a breakpoint in that function and run the parser
* When it breaks, inspect the value of `x`. In the example the parse-tree will have three sub-trees, two of which represent the (now cleared) whitespace.
* Construct the desired structure or perform the actions that are needed. In our example we return the middle value, whatever non-terminal 'value' produced.
* Obviously, if the expression has variants, all these variants must be expected and must be dealt with in this function. For instance, a JSON number is an integer, optionally followed by a fraction, optionally followed by an exponent (e.g. -1.22e+2 is a legal JSON number). The PEG rule is 
```
	number <- {{number}}(integer fraction? exponent?)
```
and the function `number` must determine the variants:
```
	number = x => Number(x[1][0]+
			(typeof x[1][1]==='string'?'.'+x[1][1]:'')+
			(typeof x[1][2]==='string'?x[1][2]:''))
``` 
* Repeat this process for every non-terminal. 
* Often, the expression leads to lists of values of indeterminate length. If `lst` is such a list, the following pattern can be used to process those values: `lst.reduce((a,v)=>exp1,exp2)` where `exp2` is an initial accumulator (e.g. `0` or `''` or `[]`) and `exp1` computes the desired element value from parse-tree element v.
* Often, the expression is complex and is easier processed by handling subexpressions first. The constants `'true'`, `'false'` and `'null'` produce similar parse-trees, which differ however from the values returned by `object`, `array`, `string` and `number`. It is therefore convenient to split off a subexpression `{{constant}}('true' / 'false' / 'null')`

File `test2.js` contains the final result of applying these steps.



## 6. Technical Manual

#### 6.1.1. `Pegling.parser`

* arguments:
	* An annotated PEG
	* A list of log events. Possible log events are:
		* `attempt`: every engine attempt
		* `nonterminals`: attempt and reduction of every entire rule
		* `engine`: every engine reduction
		* `mylog`: every ` of the pseudo-instruction 'log'
		* `myfuns`: every reduction of a code snippet
* returns:
	* a parser

#### 6.1.2. A Generated Parser

* arguments:
	* Input text
	* Expected root non-terminal
* returns: 
	* Whatever the code-snippets created

#### 6.1.3. `Pegling.rdp`

* arguments:
	* Parse rules
	* A list of log events (see Pegling.parser)
* returns:
	* a parser

#### 6.1.4. `rdi` (internal)

* arguments:
	* `inp`: the input text
	* `idx`: the character index to start parsing
	* `pat`: the pattern (non-terminal) to expect
* returns: [idxn,ast] where
	* `idxn`: is the character index after accepting `pat` in `inp`, or is -1 if the parse failed
	* `ast`: is an abstract syntax tree for the parsed non-terminal (or a data structure representing where parsing failed eventually if `idxn` is -1
	
#### 6.1.5. `Pegling.pegRules`, `Pegling.pegParser`

Auxiliary functions which form the two halves of `Pegling.parser`:

* `Pegling.pegRules` are the rules for the PEG grammar
* `Pegling.pegParser` is a parser for PeglingJS PEG specifications

### 6.2. Rules
The `rdi` rules have the following format:

* The top-level is a hash with one field for every non-terminal (i.e. the set of non-terminals / rules), e.g.
`{ grammar: ... PAG for non-terminal 'grammar' ...,`  
`  pattern:  ... PAG for non-terminal 'pattern' ...,`  
`  ... }`
* Other values are
	* Lists containing other values. Common format: [ *keyword*, *arguments...* ]
	* Strings, representing keywords and string data
	* JavaScript code

Keywords coincide with the common PEG [1] operators plus `log` and code snippets

### 6.3. Instructions
PEG's resolve a text into its structure, accepting it, or rejecting it if the text is not an instance of the PEG. In order to further process the text, that structure must be represented. It is straightforward to generate a *parse-tree*, which follows the breakdown in PEG subexpressions, but more appropriate is an *abstract syntax tree*. PeglingJS offers the ability to attribute PEG's with functions that transform the parse-tree (on the fly) to an abstract syntax tree.


* `['var', 'name']`  
parse the PEG for non-terminal `name`
* `['cat', ...]`  
parse the PEG's folowing `cat`
* `['/', ...]`  
attempt to parse the PEG's folowing `/` till the first successful parse
* `['+', ...]`  
parse one or more instances of the PEG folowing `+`
* `['*', ...]`  
parse zero or more instances of the PEG folowing `*`
* `['?', ...]`  
if an instance of the PEG after `?` exists, accept it
* `['&', ...]`  
if no instance of the PEG after `&` exists, fail
* `['!', ...]`  
if no instance of the PEG after `!` exists, fail
* `['cc', ...]`  
if an instance of the charclass exists, accept it. A charclass consits of one or more elements of a single character (e.g., 'a') or a range of characters (e.x. 'A-Z')
* `['.', ...]`  
accept a single character
* `['span', ...]`  
if the string after `span` exists, accept it
* `[ ...function..., ...]  `
Defines a function which transforms the parse-tree for the PEG after the code into an abstract syntax tree. 
* `['log', ...]`  
The pseudo-keyword `log` accepts everything the PEG does, and is used for debugging.


For example  
`[ast=>logr(ast[0].join('')),`
`   ['cat',['+',['cc','a-zA-Z']],['var','sp']]]`  
joins the individual characters into a single string 




