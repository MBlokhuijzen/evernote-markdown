// ==UserScript==
// @name         Evernote Markdown
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds markdown preview to evernote web
// @author       Jason O'Gray
// @match        https://www.evernote.com/Home.action
// @require      https://cdnjs.cloudflare.com/ajax/libs/markdown-it/6.0.0/markdown-it.min.js
// @resource     githubMdCss https://raw.githubusercontent.com/sindresorhus/github-markdown-css/gh-pages/github-markdown.css
// @grant        GM_getResourceText
// @grant        GM_addStyle
// ==/UserScript==
/* jshint -W097 */

(function(){
    'use strict';

    var MARKDOWN_PREVIEW_ENABLED = false;
    var NO_FORMAT_ID = 'gwt-debug-FormattingBar-noFormatButton';
    var MD_PREVIEW_ID = 'md-preview';
    var observerRef = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
    var observerInstance = undefined;

    var getNoFormat = function () {
        return document.getElementById(NO_FORMAT_ID);
    };

    var addMdStyle = function () {
        var style = GM_getResourceText('githubMdCss');
        GM_addStyle(style);
        GM_addStyle('.markdown-body ul, .markdown-body ol { list-style: inherit; }');
        GM_addStyle('.markdown-body ol { list-style-type: decimal; }');
        GM_addStyle('.markdown-body em { font-style: italic; }');
        GM_addStyle('.md-preview-btn { background: white; padding: 0; border: 0; cursor: pointer; outline: none;}');
        GM_addStyle('.md-preview-allow-select { -webkit-user-select: auto !important; cursor: auto !important; -moz-user-select: auto !important; }');
    };

    var toggleMarkdownPreview = function (e) {
        e.preventDefault();
        if (MARKDOWN_PREVIEW_ENABLED) {
            closePreview();
        } else {
            openPreview();
        }
        MARKDOWN_PREVIEW_ENABLED = !MARKDOWN_PREVIEW_ENABLED;
    };

    var closePreview = function () {
        var $note = getNoteContainer();
        $note.parentNode.removeChild(document.getElementById(MD_PREVIEW_ID));
        $note.style.width = '100%';
        $note.style.float = '';
    };

    var setUpObserver = function () {
        if (observerInstance === undefined) {
            observerInstance = new observerRef(updatePreview);
            var options = { attributes: true, childList: true, characterData: true };
            observerInstance.observe(document.querySelector('iframe.RichTextArea-entinymce'), options);
        }
    };

    var updatePreview = function () {
        var $mdContainer = document.getElementById(MD_PREVIEW_ID);
        if ($mdContainer) {
            var mdPreview = getNoteBody();
            $mdContainer.innerHTML = mdPreview;
        }
    };

    var openPreview = function () { 
        var $note = getNoteContainer();
        $note.style.width = '50%';
        $note.style.float = 'left';
        var $mdContainer = document.createElement('div');
        $mdContainer.style.width = '50%';
        $mdContainer.style.height = '100%';
        $mdContainer.style.float = 'right';
        $mdContainer.id = MD_PREVIEW_ID;
        $mdContainer.className += 'markdown-body md-preview-allow-select';

        $note.parentNode.appendChild($mdContainer);
        updatePreview();
        setUpObserver();
    };

    var getNoteContainer = function () {
        return document.getElementById('gwt-debug-NoteContentEditorView-root');
    };

    var getNoteBody = function () {
        return window.markdownit().render(tinyMCE.activeEditor.getContent({format: 'text'}));
    };

    var appendButton = function () {
        var $outerDiv = document.createElement('div');

        var $noFormat = getNoFormat().parentNode;

        //Clone the class
        $outerDiv.className = $noFormat.className;

        //Create the inner div
        var $innerDiv = document.createElement('div');
        $innerDiv.className = $noFormat.childNodes[0].className;

        //Create the button
        var $mdButton = document.createElement('input');
        $mdButton.value = 'MD';
        $mdButton.type = 'button';
        $mdButton.onclick = toggleMarkdownPreview;
        $mdButton.className = 'md-preview-btn';

        //Attach button to inner div and outter.
        $innerDiv.appendChild($mdButton);
        $outerDiv.appendChild($innerDiv);
        $noFormat.appendChild($outerDiv);
    };

    var waitForEditing = function () {
        if (!getNoFormat()) {
            console.log('EVERNOTE_MARKDOWN: waiting....');
            window.setTimeout(waitForEditing, 3000);
        } else {
            console.log('EVERNOTE_MARKDOWN: appending button & adding style');
            appendButton();
            addMdStyle();
        }
    };

    waitForEditing();
})();
