var helper = {
    saveSelection: function() {
        if (window.getSelection) {
            var sel = window.getSelection();

            if (sel.getRangeAt && sel.rangeCount) {
                var ranges = [];
                for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                    ranges.push(sel.getRangeAt(i));
                }
                return ranges;
            }
        } else if (document.selection && document.selection.createRange) {
            return document.selection.createRange();
        }
        return null;
    },

    restoreSelection: function(savedSel) {
        if (savedSel) {
            if (window.getSelection) {
                var sel = window.getSelection();
                sel.removeAllRanges();
                for (var i = 0, len = savedSel.length; i < len; ++i) {
                    sel.addRange(savedSel[i]);
                }
            } else if (document.selection && savedSel.select) {
                savedSel.select();
            }
        }
    },

    getLinksInSelection: function() {
        var selectedLinks = [];
        var range, containerEl, links, linkRange;
        if (window.getSelection) {
            sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                linkRange = document.createRange();
                for (var r = 0; r < sel.rangeCount; ++r) {
                    range = sel.getRangeAt(r);
                    containerEl = range.commonAncestorContainer;
                    if (containerEl.nodeType != 1) {
                        containerEl = containerEl.parentNode;
                    }
                    if (containerEl.nodeName.toLowerCase() == "a") {
                        selectedLinks.push(containerEl);
                    } else {
                        links = containerEl.getElementsByTagName("a");
                        for (var i = 0; i < links.length; ++i) {
                            linkRange.selectNodeContents(links[i]);
                            if (linkRange.compareBoundaryPoints(range.END_TO_START, range) < 1 && linkRange.compareBoundaryPoints(range.START_TO_END, range) > -1) {
                                selectedLinks.push(links[i]);
                            }
                        }
                    }
                }
                linkRange.detach();
            }
        } else if (document.selection && document.selection.type != "Control") {
            range = document.selection.createRange();
            containerEl = range.parentElement();
            if (containerEl.nodeName.toLowerCase() == "a") {
                selectedLinks.push(containerEl);
            } else {
                links = containerEl.getElementsByTagName("a");
                linkRange = document.body.createTextRange();
                for (var i = 0; i < links.length; ++i) {
                    linkRange.moveToElementText(links[i]);
                    if (linkRange.compareEndPoints("StartToEnd", range) > -1 && linkRange.compareEndPoints("EndToStart", range) < 1) {
                        selectedLinks.push(links[i]);
                    }
                }
            }
        }
        return selectedLinks;
    },

    execCommand: function (cmd, value) {
        try {
            try {
                document.execCommand('styleWithCSS', null, 1);
            } catch (ex1) {
                try {
                    document.execCommand('useCSS', null, 0);
                } catch (ex2) {
                }
            }
        } catch (ex) {
            log(ex.message, 'warn', 'exec-command');
        }

        return document.execCommand(cmd, null, value);
    }
};

var actionsDefinitions = {
    fontWeight: {
        facade: function() {
            this.set();
        },
        set: function() {
            helper.execCommand('bold', null);
        },
        check: function() {
            return document.queryCommandState("bold");
        }
    },

    color: {
        facade: function() {
            //get color here
            this.set('rgb(255, 0, 0)');
        },
        set: function(color) {
            if (this.check()) {
                document.execCommand("removeFormat", false, "foreColor");
            } else {
                helper.execCommand('foreColor', color);
            }
        },
        check: function() {
            return document.queryCommandValue('foreColor') === 'rgb(255, 0, 0)';
        }
    },

    link: {
        set: function() {
            // There's actually no need to save and restore the selection here. This is just an example.
            //var savedSel = helper.saveSelection();
            var url = document.getElementById("url").value;
            //helper.restoreSelection(savedSel);
            document.execCommand("CreateLink", false, url);
        },
        check: function() {
            //getLinksInSelection
        }
    }
};

document.addEventListener('selectionchange', function (e) {
    var $menu = $('#menu');

    for(var key in actionsDefinitions) {
        if (actionsDefinitions.hasOwnProperty(key)) {
            $menu.find('[data-action=' + key + ']').toggleClass('active', actionsDefinitions[key].check());
        }
    }
}, false);


$('#menu').on('click', '[data-action]', function(e) {
    e.preventDefault();
    e.stopPropagation();

    var $option = $(e.currentTarget);
    var action = $option.data('action');

    actionsDefinitions[action].facade();
});