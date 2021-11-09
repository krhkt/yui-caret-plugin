# YUI Caret Plugin interface for Node

Node plugin to manipulate the caret of inputs and textareas.
[Try it out](https://krhkt.github.io/yui-caret-plugin/caret-plugin-demo.html).

<strong>Note</strong>:This plugin only works with input or textarea nodes. (<code><em>node</em>.caret</code>)<br>
<dl>
    <dt><h2>Methods:</h2></dt>
    <dd>
        <dl>
            <dt><code>isValidNode()</code>:</dt>
            <dd>checks if this node is a textarea or a valid type input.</dd>
            <dt><code>insert(content)</code>:</dt>
            <dd>insert the content at the current caret position in the textarea/input as if the
                user itself had typed.</dd>
            <dt><code>clearSelection()</code>:</dt>
            <dd>deselect the actual selection and place the caret at the begining.</dd>
            <dt><code>selectAll()</code>:</dt>
            <dd>select all the content inside the textarea/input.</dd>
        </dl>
    </dd>
    <dt><h2>Attributes:</h2></dt>
    <dd>
        <dl>
            <dt><code>selectionStart</code>:</dt>
            <dd>gets or sets the start of a selection in the node.</dd>
            <dt><code>selectionEnd</code>:</dt>
            <dd>gets or sets the end of a selection in the node.</dd>
            <dt><code>range</code>:</dt>
            <dd>gets an object like <code>{start: #, end: #}</code>, where the <em>#</em> is the index
                number of the start and end indexes of the selection.<br>(in case the caret isn't
                selecting anything, the start and end will be the same)<br>
                sets the selection passing an object like<code>{start: #, end: #}</code>.</dd>
            <dt><code>position</code>:</dt>
            <dd>gets or sets the position of the caret. If the node has a selection, getting the
                position will return the begining of the selection.</dd>
            <dt><code>content</code>:</dt>
            <dd>gets selected content.<br>
                setting content will insert the new content replacing the selected content and
                keeping the selection.</dd>
        </dl>
    </dd>
</dl>
