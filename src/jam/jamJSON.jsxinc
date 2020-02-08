//------------------------------------------------------------------------------
// File: jamJSON.jsxinc
// Version: 4.5
// Release Date: 2016-09-29
// Copyright: © 2011-2016 Michel MARIANI <http://www.tonton-pixel.com/blog/>
// Licence: GPL <http://www.gnu.org/licenses/gpl.html>
//------------------------------------------------------------------------------
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//------------------------------------------------------------------------------
// Version History:
//  4.5:
//  - Incremented version number to keep in sync with other modules.
//  4.4:
//  - Normalized error messages.
//  4.0:
//  - Removed reference to 'this' for main global object.
//  3.6:
//  - Incremented version number to keep in sync with other modules.
//  3.5:
//  - Incremented version number to keep in sync with other modules.
//  3.4:
//  - Incremented version number to keep in sync with other modules.
//  3.3:
//  - Incremented version number to keep in sync with other modules.
//  3.2:
//  - Incremented version number to keep in sync with other modules.
//  3.1:
//  - Incremented version number to keep in sync with other modules.
//  3.0:
//  - Incremented version number to keep in sync with other modules.
//  2.0:
//  - Renamed jamJSON.js to jamJSON.jsxinc.
//  1.0:
//  - Initial release.
//------------------------------------------------------------------------------

/**
 * @fileOverview
 * @name jamJSON.jsxinc
 * @author Michel MARIANI
 */

if (typeof jamJSON !== 'object')
{
    /**
     * @description Global object (used to simulate a namespace in JavaScript) containing customized JSON methods
     * for translating a JavaScript data structure to and from a JSON text string; can be used in scripts written with
     * the <a href="http://www.tonton-pixel.com/blog/json-photoshop-scripting/json-action-manager/">JSON Action Manager</a> engine.
     * <ul>
     * <li>
     * Adapted from: <a href="https://github.com/douglascrockford/JSON-js/blob/master/json_parse_state.js">json_parse_state.js</a>
     * and
     * <a href="https://github.com/douglascrockford/JSON-js/blob/master/json2.js">json2.js</a>
     * by Douglas CrockFord.
     * </li>
     * <li>
     * Spotted and fixed a few problems in the Photoshop implementation of the JavaScript interpreter:
     * <ul>
     * <li>
     * In regular expressions, hexadecimal escape sequences (both \x and \u) must be in capital letters (A-F).
     * </li>
     * <li>
     *  The precedence of nested ternary operators ( ? : ) is handled differently, extra parentheses must be used.
     * </li>
     * <li>
     * The test (state instanceof SyntaxError) returns true even if state is a ReferenceError; in fact, it seems that all error
     * types: Error, EvalError,  RangeError, ReferenceError, SyntaxError, TypeError, URIError, are just  synonyms for each other;
     * therefore, one must check beforehand if a function is missing in the action table before calling it, so that no
     * ReferenceError gets ever thrown...
     * </li>
     * </ul>
     * </li>
     * </ul>
     * @author Michel MARIANI
     * @version 4.5
     * @namespace
     */
    var jamJSON = { };
    //
    (function ()
    {
        // The state of the parser, one of
        // 'go'             The starting state
        // 'ok'             The final, accepting state
        // 'firstokey'      Ready for the first key of the object or the closing of an empty object
        // 'okey'           Ready for the next key of the object
        // 'colon'          Ready for the colon
        // 'ovalue'         Ready for the value half of a key/value pair
        // 'ocomma'         Ready for a comma or closing }
        // 'firstavalue'    Ready for the first value of an array or an empty array
        // 'avalue'         Ready for the next value of an array
        // 'acomma'         Ready for a comma or closing ]
        var state;
        var stack;      // The stack, for controlling nesting.
        var container;  // The current container object or array
        var key;        // The current key
        var value;      // The current value
        // Escapement translation table
        var escapes =
        {
            '\\': '\\',
            '"': '"',
            '/': '/',
            't': '\t',
            'n': '\n',
            'r': '\r',
            'f': '\f',
            'b': '\b'
        };
        // The action table describes the behavior of the machine. It contains an object for each token.
        // Each object contains a method that is called when a token is matched in a state.
        // An object will lack a method for illegal states.
        var action =
        {
            '{':
            {
                go: function ()
                {
                    stack.push ({ state: 'ok' });
                    container = { };
                    state = 'firstokey';
                },
                ovalue: function ()
                {
                    stack.push ({ container: container, state: 'ocomma', key: key });
                    container = { };
                    state = 'firstokey';
                },
                firstavalue: function ()
                {
                    stack.push ({ container: container, state: 'acomma' });
                    container = { };
                    state = 'firstokey';
                },
                avalue: function ()
                {
                    stack.push ({ container: container, state: 'acomma' });
                    container = { };
                    state = 'firstokey';
                }
            },
            '}':
            {
                firstokey: function ()
                {
                    var pop = stack.pop ();
                    value = container;
                    container = pop.container;
                    key = pop.key;
                    state = pop.state;
                },
                ocomma: function ()
                {
                    var pop = stack.pop ();
                    container[key] = value;
                    value = container;
                    container = pop.container;
                    key = pop.key;
                    state = pop.state;
                }
            },
            '[':
            {
                go: function ()
                {
                    stack.push ({ state: 'ok' });
                    container = [ ];
                    state = 'firstavalue';
                },
                ovalue: function ()
                {
                    stack.push ({ container: container, state: 'ocomma', key: key });
                    container = [ ];
                    state = 'firstavalue';
                },
                firstavalue: function ()
                {
                    stack.push ({ container: container, state: 'acomma' });
                    container = [ ];
                    state = 'firstavalue';
                },
                avalue: function ()
                {
                    stack.push ({ container: container, state: 'acomma' });
                    container = [ ];
                    state = 'firstavalue';
                }
            },
            ']':
            {
                firstavalue: function ()
                {
                    var pop = stack.pop ();
                    value = container;
                    container = pop.container;
                    key = pop.key;
                    state = pop.state;
                },
                acomma: function ()
                {
                    var pop = stack.pop ();
                    container.push (value);
                    value = container;
                    container = pop.container;
                    key = pop.key;
                    state = pop.state;
                }
            },
            ':':
            {
                colon: function ()
                {
                    if (container.hasOwnProperty (key))
                    {
                        throw new SyntaxError ("[jamJSON.parse] Duplicate key: “" + key + "”");
                    }
                    state = 'ovalue';
                }
            },
            ',':
            {
                ocomma: function ()
                {
                    container[key] = value;
                    state = 'okey';
                },
                acomma: function ()
                {
                    container.push (value);
                    state = 'avalue';
                }
            },
            'true':
            {
                go: function ()
                {
                    value = true;
                    state = 'ok';
                },
                ovalue: function ()
                {
                    value = true;
                    state = 'ocomma';
                },
                firstavalue: function ()
                {
                    value = true;
                    state = 'acomma';
                },
                avalue: function ()
                {
                    value = true;
                    state = 'acomma';
                }
            },
            'false':
            {
                go: function ()
                {
                    value = false;
                    state = 'ok';
                },
                ovalue: function ()
                {
                    value = false;
                    state = 'ocomma';
                },
                firstavalue: function ()
                {
                    value = false;
                    state = 'acomma';
                },
                avalue: function ()
                {
                    value = false;
                    state = 'acomma';
                }
            },
            'null':
            {
                go: function ()
                {
                    value = null;
                    state = 'ok';
                },
                ovalue: function ()
                {
                    value = null;
                    state = 'ocomma';
                },
                firstavalue: function ()
                {
                    value = null;
                    state = 'acomma';
                },
                avalue: function ()
                {
                    value = null;
                    state = 'acomma';
                }
            }
        };
        // The actions for number tokens
        var number =
        {
            go: function ()
            {
                state = 'ok';
            },
            ovalue: function ()
            {
                state = 'ocomma';
            },
            firstavalue: function ()
            {
                state = 'acomma';
            },
            avalue: function ()
            {
                state = 'acomma';
            }
        };
        // The actions for string tokens
        var string =
        {
            go: function ()
            {
                state = 'ok';
            },
            firstokey: function ()
            {
                key = value;
                state = 'colon';
            },
            okey: function ()
            {
                key = value;
                state = 'colon';
            },
            ovalue: function ()
            {
                state = 'ocomma';
            },
            firstavalue: function ()
            {
                state = 'acomma';
            },
            avalue: function ()
            {
                state = 'acomma';
            }
        };
        //
        var commentFunc = function () { };  // No state change
        //
        function debackslashify (text)
        {
            // Remove and replace any backslash escapement.
            return text.replace (/\\(?:u(.{4})|([^u]))/g, function (a, b, c) { return (b) ? String.fromCharCode (parseInt (b, 16)) : escapes[c]; });
        }
        //
        /**
         * @description Convert a JSON text string into a JavaScript data structure.<br />
         * <ul>
         * <li>
         * Adapted from <a href="https://github.com/douglascrockford/JSON-js/blob/master/json_parse_state.js">json_parse_state.js</a> by Douglas Crockford:
         * <ul>
         * <li>
         * Removed the reviver parameter.
         * </li>
         * <li>
         * Added an extra validate parameter; if false (or undefined), a simple eval is performed.
         * </li>
         * <li>
         * Added an extra allowComments parameter; if false (or undefined), validation does not allow comments (strict JSON).
         * </li>
         * <li>
         * Corrected the regular expression for numbers to conform to the JSON grammar;
         * cf. <a href="http://www.json.org/">Introducing JSON</a> and <a href="http://www.ietf.org/rfc/rfc4627.txt">RFC 4627</a>.
         * </li>
         * </ul>
         * </li>
         * </ul>
         * @param {String} text JSON text string
         * @param {Boolean} [validate] validate JSON syntax while parsing
         * @param {Boolean} [allowComments] validate comments too
         * @returns {Object|Array|String|Number|Boolean|Null} JavaScript data structure (usually an object or array)
         * @see jamJSON.stringify
         * @example
         * var jsonText = '{ "Last Name": "Einstein", "First Name": "Albert" }';
         * try
         * {
         *     var jsObj = jamJSON.<strong>parse</strong> (jsonText, true);
         *     alert (jsObj["First Name"] + " " + jsObj["Last Name"]);    // -> Albert Einstein
         * }
         * catch (e)
         * {
         *     alert ("E≠mc2!");
         * }
         */
        jamJSON.parse = function (text, validate, allowComments)
        {
            if (validate)
            {
                // Use a state machine rather than the dangerous eval function to parse a JSON text.
                // A regular expression is used to extract tokens from the JSON text.
                var tx = /^[\x20\t\n\r]*(?:([,:\[\]{}]|true|false|null)|(-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+\-]?[0-9]+)?)|"((?:[^\r\n\t\\\"]|\\(?:["\\\/trnfb]|u[0-9a-fA-F]{4}))*)")/;
                var txc = /^[\x20\t\n\r]*(?:(\/(?:\/.*|\*(?:.|[\r\n])*?\*\/))|([,:\[\]{}]|true|false|null)|(-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+\-]?[0-9]+)?)|"((?:[^\r\n\t\\\"]|\\(?:["\\\/trnfb]|u[0-9a-fA-F]{4}))*)")/;
                // The extraction process is cautious.
                var r;          // The result of the exec method.
                var i;          // The index shift in result array
                var actionFunc; // The current action function
                // Set the starting state.
                state = 'go';
                // The stack records the container, key, and state for each object or array
                // that contains another object or array while processing nested structures.
                stack = [ ];
                // If any error occurs, we will catch it and ultimately throw a syntax error.
                try
                {
                    // For each token...
                    while (true)
                    {
                        i = (allowComments) ? 1 : 0;
                        r = (allowComments) ? txc.exec (text) : tx.exec (text);
                        if (!r)
                        {
                            break;
                        }
                        // r is the result array from matching the tokenizing regular expression.
                        //  r[0] contains everything that matched, including any initial whitespace.
                        //  r[1] contains any punctuation that was matched, or true, false, or null.
                        //  r[2] contains a matched number, still in string form.
                        //  r[3] contains a matched string, without quotes but with escapement.
                        if (allowComments && r[1])
                        {
                            // Comment: just do nothing...
                            actionFunc = commentFunc;
                        }
                        else if (r[i + 1])
                        {
                            // Token: execute the action for this state and token.
                            actionFunc = action[r[i + 1]][state];
                        }
                        else if (r[i + 2])
                        {
                            // Number token: convert the number string into a number value and execute
                            // the action for this state and number.
                            value = +r[i + 2];
                            actionFunc = number[state];
                        }
                        else    // Do not test r[i + 3] explicitely since a string can be empty
                        {
                            // String token: replace the escapement sequences and execute the action for
                            // this state and string.
                            value = debackslashify (r[i + 3]);
                            actionFunc = string[state];
                        }
                        //
                        if (actionFunc)
                        {
                            actionFunc ();
                            // Remove the token from the string. The loop will continue as long as there
                            // are tokens. This is a slow process, but it allows the use of ^ matching,
                            // which assures that no illegal tokens slip through.
                            text = text.slice (r[0].length);
                        }
                        else
                        {
                            break;
                        }
                    }
                }
                catch (e)
                {
                    // If we find a state/token combination that is illegal, then the action will
                    // cause an error. We handle the error by simply changing the state.
                    state = e;
                }
                // The parsing is finished. If we are not in the final 'ok' state, or if the
                // remaining source text contains anything except whitespace, then we did not have
                // a well-formed JSON text.
                if (state !== 'ok' || /[^\x20\t\n\r]/.test (text))
                {
                    throw state instanceof SyntaxError ? state : new SyntaxError ("[jamJSON.parse] Invalid JSON");
                }
                return value;
            }
            else
            {
                // Let's live dangerously (but so fast)! ;-)
                return eval ('(' + text + ')');
            }
        };
        //
        var escapable = /[\\\"\x00-\x1F\x7F-\x9F\u00AD\u0600-\u0604\u070F\u17B4\u17B5\u200C-\u200F\u2028-\u202F\u2060-\u206F\uFEFF\uFFF0-\uFFFF]/g;
        var meta =  // table of character substitutions
        {
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        };
        var gap;
        var indent;
        var prefixIndent;
        //
        function quote (string)
        {
            // If the string contains no control characters, no quote characters, and no
            // backslash characters, then we can safely slap some quotes around it.
            // Otherwise we must also replace the offending characters with safe escape
            // sequences.
            escapable.lastIndex = 0;
            return escapable.test (string) ?
                '"' + string.replace (escapable, function (a) {
                    var c = meta[a];
                    return (typeof c === 'string') ? c : '\\u' + ('0000' + a.charCodeAt (0).toString (16).toUpperCase ()).slice (-4);
                }) + '"' : '"' + string + '"';
        }
        //
        function str (value)    // Produce a string from value.
        {
            var i;  // The loop counter.
            var k;  // The member key.
            var v;  // The member value.
            var mind = gap;
            var partial;
            // What happens next depends on the value's type.
            switch (typeof value)
            {
                case 'string':
                    return quote (value);
                case 'number':
                    // JSON numbers must be finite. Encode non-finite numbers as null.
                    return isFinite (value) ? String (value) : 'null';
                case 'boolean':
                case 'null':
                    // If the value is a boolean or null, convert it to a string. Note:
                    // typeof null does not produce 'null'. The case is included here in
                    // the remote chance that this gets fixed someday.
                    return String (value);
                case 'object':  // If the type is 'object', we might be dealing with an object or an array or null.
                    // Due to a specification blunder in ECMAScript, typeof null is 'object',
                    // so watch out for that case.
                    if (!value)
                    {
                        return 'null';
                    }
                    // Make an array to hold the partial results of stringifying this object value.
                    gap += indent;
                    partial = [ ];
                    // Is the value an array?
                    if (value.constructor === Array)
                    {
                        // The value is an array. Stringify every element.
                        for (i = 0; i < value.length; i++)
                        {
                            partial[i] = str (value[i]);
                        }
                        // Join all of the elements together, separated with commas, and wrap them in brackets.
                        v = (partial.length === 0) ?
                            (gap ? '[\n' + prefixIndent + mind + ']' : '[ ]') :
                            (gap ? '[\n' + prefixIndent + gap + partial.join (',\n' + prefixIndent + gap) + '\n' + prefixIndent + mind + ']' : '[ ' + partial.join (', ') + ' ]');
                        gap = mind;
                        return v;
                    }
                    else
                    {
                        // Iterate through all of the keys in the object.
                        for (k in value)
                        {
                            if (value.hasOwnProperty (k))
                            {
                                v = str (value[k]);
                                if (v)  // Useless ?
                                {
                                    partial.push (quote (k) + (gap && ((v.charAt (0) === '{') || (v.charAt (0) === '[')) ? ':\n' + prefixIndent + gap : ': ') + v);
                                }
                            }
                        }
                        // Join all of the member texts together, separated with commas, and wrap them in braces.
                        v = (partial.length === 0) ?
                            (gap ? '{\n' + prefixIndent + mind + '}' : '{ }') :
                            (gap ? '{\n' + prefixIndent + gap + partial.join (',\n' + prefixIndent + gap) + '\n' + prefixIndent + mind + '}' : '{ ' + partial.join (', ') + ' }');
                        gap = mind;
                        return v;
                    }
                default:
                    throw new SyntaxError ("[jamJSON.stringify] Invalid JSON");
            }
        }
        //
        /**
         * @description Convert a JavaScript data structure into a JSON text string.<br />
         * <ul>
         * <li>
         * Adapted from <a href="https://github.com/douglascrockford/JSON-js/blob/master/json2.js">json2.js</a> by Douglas Crockford:
         * <ul>
         * <li>
         * Removed the replacer parameter.
         * </li>
         * <li>
         * No handling of toJSON methods whatsoever.
         * </li>
         * <li>
         * Added an extra prefix parameter to allow the insertion of the resulting text into already-indented code.
         * </li>
         * <li>
         * Improved indenting so that pairs of brackets { } and [ ] are always aligned on the same vertical position.
         * </li>
         * <li>
         * Single spaces are systematically inserted for better readability when indenting is off.
         * </li>
         * <li>
         * A syntax error is thrown for any invalid JSON element (undefined, function, etc.).
         * </li>
         * </ul>
         * </li>
         * </ul>
         * @param {Object|Array|String|Number|Boolean|Null} value JavaScript data structure (usually an object or array)
         * @param {String|Number} [space] Indent space string (e.g. "\t") or number of spaces
         * @param {String|Number} [prefix] Prefix space string (e.g. "\t") or number of spaces
         * @returns {String} JSON text string
         * @see jamJSON.parse
         * @example
         * var dummy = null;
         * var jsArr =
         * [
         *     3.14E0,
         *     'Hello ' + 'JSON!',
         *     { on: (0 === 0) },
         *     [ 1 + 1, dummy ]
         * ];
         * alert (jamJSON.<strong>stringify</strong> (jsArr));  // -> [ 3.14, "Hello JSON!", { "on": true }, [ 2, null ] ]
         */
        jamJSON.stringify = function (value, space, prefix)
        {
            // The stringify method takes a value, two optional parameters: space and prefix, and returns a JSON text.
            // Use of the space parameter can produce text that is more easily readable.
            // Use of the prefix parameter allows the insertion of the resulting text into some existing code already indented.
            var i;
            gap = '';
            indent = '';
            prefixIndent = '';
            //
            // If the space parameter is a number, make an indent string containing that many spaces.
            if (typeof space === 'number')
            {
                for (i = 0; i < space; i++)
                {
                    indent += ' ';
                }
            }
            else if (typeof space === 'string') // If the space parameter is a string, it will be used as the indent string.
            {
                indent = space;
            }
            // If the prefix parameter is a number, make a prefix indent string containing that many spaces.
            if (typeof prefix === 'number')
            {
                for (i = 0; i < prefix; i++)
                {
                    prefixIndent += ' ';
                }
            }
            else if (typeof prefix === 'string')    // If the prefix parameter is a string, it will be used as the prefix indent string.
            {
                prefixIndent = prefix;
            }
            // Return the result of stringifying the value.
            return prefixIndent + str (value);
        };
    } ());
}

//------------------------------------------------------------------------------

