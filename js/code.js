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

    getSelectionString: function() {
        return this.saveSelection().toString();
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
        facade: function(subAction) {
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
        facade: function(subAction) {
            //get color here
            this.set('rgb(255, 0, 0)');
        },
        set: function(color) {
            if (this.check()) {
                helper.execCommand("removeFormat", false, "foreColor");
            } else {
                helper.execCommand('foreColor', color);
            }
        },
        check: function() {
            return document.queryCommandValue('foreColor') === 'rgb(255, 0, 0)';
        }
    },

    fontFamily: {
        facade: function(subAction) {
            //get color here
            var fontFamily = document.querySelector('#font_family').value;

            this.set(fontFamily);
        },
        set: function(fontFamily) {
            helper.execCommand('fontname', fontFamily);
        },
        check: function() {
            console.log(document.queryCommandValue('fontname'), "||||", document.querySelector('#font_family').value)
            return document.queryCommandValue('fontname').replace(/(\"|\')/g, '') === (document.querySelector('#font_family').value.replace(/(\"|\')/g, ''));
        }
    },

    link: {
        facade: function(subAction) {
            this.set(subAction);
        },
        set: function(subAction) {
            var selectedString = helper.getSelectionString();
            var areLinksSelected = helper.getLinksInSelection().length > 0;

            if (areLinksSelected) {
                //Remove links from selection
                document.execCommand('unlink', false, false);
            } else {
                switch (subAction) {
                    case 'web':
                        //<a href="http://www.wp.pl" data-url="http://www.wp.pl" title="" target="_blank"></a>

                        var link_web_url = document.querySelector('#link_web_url').value;
                        var link_web_title = document.querySelector('#link_web_title').value;
                        var link_web_target = document.querySelector('#link_web_target').value;

                        document.execCommand(
                            'insertHTML',
                            false,
                            '<a href="' + link_web_url + '" data-url="' + link_web_url + '" title="' + link_web_title + '" target="' + link_web_target + '">' + selectedString + '</a>'
                        );
                        break;
                    case 'email':
                        //<a href="mailto:spam@uzza.pl?subject=title" data-url="mailto:spam@uzza.pl?subject=title" title="subject" target="_self"></a>

                        var link_email_email = document.querySelector('#link_email_email').value;
                        var link_email_subject = document.querySelector('#link_email_subject').value;
                        var link_email_title = document.querySelector('#link_email_title').value;

                        var url = 'mailto:' + link_email_email + '?subject=' + link_email_subject;

                        document.execCommand(
                            'insertHTML',
                            false,
                            '<a href="' + url + '" data-url="' + url + '" title="' + link_email_title + '" target="_self">' + selectedString + '</a>'
                        );

                        break;
                    case 'section':
                        //<a href="#section-vvvb7" data-url="#section-vvvb7" title="subject" target="_self"></a>

                        var link_section_id = document.querySelector('#link_section_id').value;

                        document.execCommand(
                            'insertHTML',
                            false,
                            '<a href="#' + link_section_id +'" data-url="#' + link_section_id + '" title="subject" target="_self">' + selectedString + '</a>'
                        );

                        break;
                }
            }
        },
        check: function() {
            return helper.getLinksInSelection().length > 0;
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
    var subAction = $option.data('subaction');

    actionsDefinitions[action].facade(subAction);
});