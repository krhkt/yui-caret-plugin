YUI.add('caret-plugin', function (Y) {
    var _SelectionControl,
        Caret,
        L = Y.Lang;

    //the caret control logic is separated from the YUI framework to enable anyone who wants
    //to port it to another framework, or just use it as it is.
    _SelectionControl = {
        isValidNode: function (elem) {
            //this is meant as a caret control, not a selection one. Because of that, it will only
            //cover input and textarea. Any selection in the document should be done in another way
            return elem && (
                (elem.nodeName.toLowerCase() === 'textarea')
                || (
                        (elem.nodeName.toLowerCase() === 'input')
                        //not allowed input types
                        && (['radio', 'checkbox', 'submit', 'file', 'hidden',
                             'reset', 'button', 'image', 'range'].indexOf(
                                elem.getAttribute('type') || elem.type
                            ) === -1)
                )
            );
        },

        //since the selection has a start and an end
        //direction 1 means to get the index at the start of the selection
        //direction -1 means to get the index at the end of the selection
        //direction 0 means to return a object containing a start and end properties.
        getSelection: function (elem, direction) {
            var caretPos = -1,
                ie = {};

            //IE (tests the setSelectionRange first to use it if IE implements it someday,
            //    and avoid a browser that simulates the IE selection control to use it)
            if (!elem.setSelectionRange && document.selection) {
                //another browser, not IE and not standards
                if (!elem.ownerDocument.selection || !elem.ownerDocument.selection.createRange) {

                    Y.log('The caret-plugin does not support this browser.',
                        'error', 'selection-control');
                    return caretPos;
                }

                ie.oRange = elem.ownerDocument.selection.createRange();
                
                //checking if the selection is in the given element "elem"
                if (elem !== ie.oRange.parentElement()) {
                    return caretPos;
                }

                //moveStart and moveEnd use the first argument to determine the unit for walk
                //this unit is one of the strings:
                // character | word | sentence | textedit
                ie.unit = 'character';

                ie.isInput = (elem.nodeName.toLowerCase() === 'input');
                
                //finding the start or end position
                ie.helperRange = ie.oRange.duplicate();

                //true means collapse at start of the selection
                //false means collapse at end
                ie.helperRange.collapse(direction !== -1);

                if (ie.isInput) {
                    //in case of input, this is more faster
                    caretPos = -ie.helperRange.moveStart(ie.unit, (-1 * elem.value.length));
                } else {
                    //WARNING:
                    //this is the only way I found to specific find the index of the selection
                    //position inside a TEXTAREA. I red all the MSDN documentation about this
                    //and I failed finding a better way. If anyone knows how, please email me.

                    //the caretPos must starts with -1 because it will run at least one time
                    for (caretPos = -1; ie.helperRange.parentElement() === elem; caretPos += 1) {
                        ie.helperRange.moveStart(ie.unit, -1);
                    }
                }
                
                if ((direction === 1) || (direction === -1)) {
                    return caretPos;
                }

                caretPos = {start: caretPos};

                //finding the end position
                ie.helperRange = ie.oRange.duplicate();
                ie.helperRange.collapse(false); //collapsing at the end of the selection this time

                if (ie.isInput) {
                    caretPos.end = -ie.helperRange.moveStart(ie.unit, (-1 * elem.value.length));
                } else {
                    for (caretPos.end = -1; ie.helperRange.parentElement() === elem; caretPos.end += 1) {
                        ie.helperRange.moveStart(ie.unit, -1);
                    }
                }
            } else {
                //this is for everyone else
                if (direction === -1) {
                    return (elem.selectionEnd === undefined) ? 0 : elem.selectionEnd;
                } else if (direction === 1) {
                    return (elem.selectionStart === undefined) ? 0 : elem.selectionStart;
                } else {
                    caretPos = {
                        start: (elem.selectionEnd === undefined) ? 0 : elem.selectionStart,
                        end: (elem.selectionStart === undefined) ? 0 : elem.selectionEnd
                    };
                }
            }

            return caretPos;
        },

        //put the caret in the position or make a selection
        setSelection: function (elem, indexStart, indexEnd) {
            var oRange;

            if (indexStart !== undefined) {
                indexEnd = indexEnd ? indexEnd : indexStart;
            } else {
                indexStart = 0;
                indexEnd = elem.value.length;
            }

            
            if (elem.setSelectionRange) { 
                //standards
                elem.focus();
                elem.setSelectionRange(indexStart, indexEnd);

            } else if (elem.createTextRange) {
                //IE
                elem.focus();
                oRange = elem.createTextRange();

                oRange.collapse(true); //collapsing at the begining
                oRange.moveEnd('character', indexEnd);
                oRange.moveStart('character', indexStart);
                
                oRange.select();

            } else {
                //unknow
                elem.select();
            }

            return elem;
        },

        getSelectedContent: function (elem) {
            var content,
                selection = this.getSelection(elem);

            if (selection === -1) {
                return '';
            }

            content = elem.value;

            //eliminating the carriage return that can appear in textarea
            //and is treated as one char by IE
            if ((content.indexOf('\r\n') !== -1) && (document.selection !== undefined)) {
                content = content.replace(/\r\n/g, '\n');
            }

            return content.substring(selection.start, selection.end);
        }
    };

    Caret = Y.Base.create('caret', Y.Plugin.Base, [], {
        //pointer to the DOM node
        _DOMNode: null,

        initializer: function () {
            this._DOMNode = this.get('host').getDOMNode();
        },

        isValidNode: function () {
            return _SelectionControl.isValidNode(this._DOMNode);
        },

        //this will insert as if the user itself had typed
        insert: function (content) {
            this.set('content', content);

            this.set('position', this.get('selectionEnd'));
        },

        clearSelection: function () {
            _SelectionControl.setSelection(this._DOMNode, 0, 0);
        },

        selectAll: function () {
            _SelectionControl.setSelection(this._DOMNode);
        }
    }, {
        NS: 'caret',
        ATTRS: {
            selectionStart: {
                lazyAdd: false,
                value: null,
                getter: function () {
                    if (!this.isValidNode()) return 0;
                    
                    return _SelectionControl.getSelection(this._DOMNode, 1);
                },
                setter: function (index) {
                    var end;

                    if ((index === null) || !this.isValidNode()) return;

                    end = _SelectionControl.getSelection(this._DOMNode, -1);

                    if (index > end) {
                        end = index;
                    }
                    _SelectionControl.setSelection(this._DOMNode, index, end);

                    return index;
                },
                validator: function (index) {
                    return (L.isNumber(index)) && (index >= 0) && (index < this.get('host').get('value').length);
                }
            },

            selectionEnd: {
                lazyAdd: false,
                value: null,
                getter: function () {
                    if (!this.isValidNode()) return 0;
                    
                    return _SelectionControl.getSelection(this._DOMNode, -1);
                },
                setter: function (index) {
                    var start;

                    if ((index === null) || !this.isValidNode()) return;

                    start = _SelectionControl.getSelection(this._DOMNode, 1);

                    if (index < start) {
                        start = index;
                    }
                    _SelectionControl.setSelection(this._DOMNode, start, index);

                    return index;
                },
                validator: function (index) {
                    return (L.isNumber(index)) && (index >= 0) && (index < this.get('host').get('value').length);
                }
            },

            //shortcut to start and end attributes, but optimized
            range: {
                lazyAdd: false,
                value: null,
                getter: function () {
                    if (!this.isValidNode()) return null;

                    return _SelectionControl.getSelection(this._DOMNode, 0);
                },

                setter: function (index) {
                    if ((index === null) || !this.isValidNode()) return;
                    
                    _SelectionControl.setSelection(this._DOMNode, index.start, index.end);
                }
            },

            //places the caret at the especified position index
            position: {
                lazyAdd: false,
                value: null,
                getter: function () {
                    if (!this.isValidNode()) return null;

                    return _SelectionControl.getSelection(this._DOMNode, 1);
                },

                setter: function (index) {
                    if ((index === null) || !this.isValidNode()) return;
                    
                    _SelectionControl.setSelection(this._DOMNode, index, index);
                }
            },

            //manipulates the content of the selection
            //if content is setted, it will insert the new content replacing the selected content
            //keeping the selection
            content: {
                lazyAdd: false,
                value: null,
                getter: function () {
                    if (!this.isValidNode()) return null;
                    
                    return _SelectionControl.getSelectedContent(this._DOMNode);
                },

                setter: function (newContent) {
                    var index, 
                        actualContent,
                        contentParts;

                    if ((newContent === null) || !this.isValidNode()) return;

                    newContent = L.isUndefined(newContent) ? '' : newContent.toString();

                    index = _SelectionControl.getSelection(this._DOMNode, 0);
                    actualContent = this.get('host').get('value');

                    contentParts = actualContent.substring(0, index.start) + //before selection
                        newContent +                                         //selection
                        actualContent.substring(index.end);                  //after selection

                    this.get('host').set('value', contentParts);

                    index.end = index.start + newContent.length;

                    _SelectionControl.setSelection(this._DOMNode, index.start, index.end);
                }
            }
        }
    });

    //publishing plugin
    Y.Plugin.Caret = Caret;
}, '1.0', {
    requires: ['node', 'base', 'plugin']
});
