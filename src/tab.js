/* This file is part of Tryton.  The COPYRIGHT file at the top level of
   this repository contains the full copyright notices and license terms. */
(function() {
    'use strict';

    Sao.Tab = Sao.class_(Object, {
        init: function() {
            Sao.Tab.tabs.push(this);
            this.buttons = {};
            this.id = 'tab-' + Sao.Tab.counter++;
            this.name_el = jQuery('<span/>');
        },
        create_tabcontent: function() {
            this.el = jQuery('<div/>', {
                'class': this.class_
            });

            var toolbar = this.create_toolbar().appendTo(this.el);
            this.title = toolbar.find('a.navbar-brand');

            if (this.info_bar) {
                this.el.append(this.info_bar.el);
            }
        },
        set_menu: function(menu) {
            this.menu_def().forEach(function(definition) {
                var icon = definition[0];
                var name = definition[1];
                var func = definition[2];
                var item = jQuery('<li/>', {
                    'role': 'presentation'
                }).appendTo(menu);
                var link = jQuery('<a/>', {
                    'role': 'menuitem',
                    'href': '#',
                    'tabindex': -1
                }).append(jQuery('<span/>', {
                    'class': 'glyphicon ' + icon,
                    'aria-hidden': 'true'
                })).append(' ' + name).appendTo(item);
                if (func) {
                    link.click(function() {
                        this[func]();
                    }.bind(this));
                } else {
                    item.addClass('disabled');
                }
            }.bind(this));
        },
        create_toolbar: function() {
            var toolbar = jQuery(
                    '<nav class="navbar navbar-default toolbar" role="navigation">' +
                    '<div class="container-fluid">' +
                    '<div class="navbar-header">' +
                    '<a class="navbar-brand" href="#"></a>' +
                    '<button type="button" class="navbar-toggle collapsed" ' +
                    'data-toggle="collapse" ' +
                    'data-target="#navbar-' + this.id + '">' +
                    '<span class="sr-only">' +
                    Sao.i18n.gettext('Toggle navigation') +
                    '</span>' +
                    '<span class="icon-bar"></span>' +
                    '<span class="icon-bar"></span>' +
                    '<span class="icon-bar"></span>' +
                    '</div>' +
                    '<div class="collapse navbar-collapse" ' +
                    'id="navbar-' + this.id + '">' +
                    '<ul class="nav navbar-nav">' +
                    '<li class="dropdown">' +
                    '<a href="#" class="dropdown-toggle" ' +
                    'data-toggle="dropdown" role="button" ' +
                    'aria-expanded="false">' +
                    '<span class="glyphicon glyphicon-wrench" ' +
                    'aria-hidden="true"></span>' +
                    '<span class="visible-xs">' +
                    Sao.i18n.gettext('Menu') +
                    '</span>' +
                    '<span class="caret"></span>' +
                    '</a>' +
                    '<ul class="dropdown-menu" role="menu">' +
                    '</ul>' +
                    '</li>' +
                    '</ul>' +
                    '</div>' +
                    '</div>' +
                    '</nav>'
                    );
            var wrapper = jQuery('<div/>', {
                'class': 'nav-wrapper'
            }).append(toolbar);
            this.set_menu(toolbar.find('ul[role*="menu"]'));

            var add_button = function(tool) {
                var item = jQuery('<li/>', {
                    'role': 'presentation'
                }).appendTo(toolbar.find('.navbar-collapse > ul'));
                this.buttons[tool[0]] = jQuery('<a/>', {
                    'role': 'menuitem',
                    'href': '#',
                    'id': tool[0]
                })
                .append(jQuery('<span/>', {
                    'class': 'glyphicon ' + tool[1],
                    'aria-hidden': 'true'
                }))
                .append(jQuery('<span/>', {
                    'class': 'hidden-sm'
                }).append(' ' + tool[2]))
                .appendTo(item);
                if (tool[4]) {
                    this.buttons[tool[0]].click(this[tool[4]].bind(this));
                } else {
                    item.addClass('disabled');
                }
                // TODO tooltip
            };
            this.toolbar_def().forEach(add_button.bind(this));
            var tabs = jQuery('#tabs');
            toolbar.affix({
                'target': tabs.parent(),
                'offset': {
                    'top': function() {
                        return tabs.find('.nav-tabs').height();
                    }
                }
            });
            toolbar.on('affix.bs.affix', function() {
                wrapper.height(toolbar.height());
            });
            toolbar.on('affix-top.bs.affix affix-bottom.bs.affix',
                    function() {
                        wrapper.height('');
                    });
            toolbar.on('affixed.bs.affix', function() {
                Sao.Tab.affix_set_with(toolbar);
            });
            toolbar.on('affixed-top.bs.affix affixed-bottom.bs.affix',
                    function() {
                        Sao.Tab.affix_unset_width(toolbar);
                    });
            return wrapper;
        },
        close: function() {
            var tabs = jQuery('#tabs');
            var tab = tabs.find('#nav-' + this.id);
            var content = tabs.find('#' + this.id);
            tabs.find('a[href="#' + this.id + '"]').tab('show');
            return this._close_allowed().then(function() {
                var next = tab.next();
                if (!next.length) {
                    next = tab.prev();
                }
                tab.remove();
                content.remove();
                Sao.Tab.tabs.splice(Sao.Tab.tabs.indexOf(this), 1);
                if (next) {
                    next.find('a').tab('show');
                }
                tabs.trigger('ready');
            }.bind(this));
        },
        _close_allowed: function() {
            return jQuery.when();
        },
        set_name: function(name) {
            this.name_el.text(name);
        }
    });

    Sao.Tab.affix_set_with = function(toolbar) {
        var width = jQuery(toolbar.parent()).width();
        toolbar.css('width', width);
    };
    Sao.Tab.affix_unset_width = function(toolbar) {
        toolbar.css('width', '');
    };
    jQuery(window).resize(function() {
        jQuery('.toolbar').each(function(i, toolbar) {
            toolbar = jQuery(toolbar);
            toolbar.affix('checkPosition');
            if (toolbar.hasClass('affix')) {
                Sao.Tab.affix_set_with(toolbar);
            } else {
                Sao.Tab.affix_unset_width(toolbar);
            }
        });
    });

    Sao.Tab.counter = 0;
    Sao.Tab.tabs = [];
    Sao.Tab.tabs.close = function(warning) {
        if (warning && Sao.Tab.tabs.length) {
            return Sao.common.sur.run(
                    Sao.i18n.gettext(
                        'The following action requires to close all tabs.\n' +
                        'Do you want to continue?')).then(function() {
                return Sao.Tab.tabs.close(false);
            });
        }
        if (Sao.Tab.tabs.length) {
            var tab = Sao.Tab.tabs[0];
            return tab.close().then(function() {
                if (!~Sao.Tab.tabs.indexOf(tab)) {
                    return Sao.Tab.tabs.close();
                } else {
                    return jQuery.Deferred().reject();
                }
            });
        }
        if (Sao.main_menu_screen) {
            return Sao.main_menu_screen.save_tree_state().then(function() {
                Sao.main_menu_screen = null;
            });
        }
        return jQuery.when();
    };
    Sao.Tab.tabs.get_current = function() {
        var tabs = jQuery('#tabs > ul');
        var i = tabs.find('li').index(tabs.find('li.active'));
        return Sao.Tab.tabs[i];
    };
    Sao.Tab.tabs.close_current = function() {
        var tab = this.get_current();
        tab.close();
    };

    Sao.Tab.create = function(attributes) {
        if (attributes.context === undefined) {
            attributes.context = {};
        }
        var tab;
        if (attributes.model) {
            tab = new Sao.Tab.Form(attributes.model, attributes);
        } else {
            tab = new Sao.Tab.Board(attributes);
        }
        Sao.Tab.add(tab);
    };

    Sao.Tab.add = function(tab) {
        var tabs = jQuery('#tabs');
        var tab_link = jQuery('<a/>', {
            'aria-controls': tab.id,
            'role': 'tab',
            'data-toggle': 'tab',
            'href': '#' + tab.id
        })
        .append(jQuery('<button/>', {
            'class': 'close'
        }).append(jQuery('<span/>', {
            'aria-hidden': true
        }).append('&times;')).append(jQuery('<span/>', {
            'class': 'sr-only'
        }).append(Sao.i18n.gettext('Close'))).click(function() {
            tab.close();
        }))
        .append(tab.name_el);
        jQuery('<li/>', {
            'role': 'presentation',
            id: 'nav-' + tab.id
        }).append(tab_link)
        .appendTo(tabs.find('> .nav-tabs'));
        jQuery('<div/>', {
            role: 'tabpanel',
            'class': 'tab-pane',
            id: tab.id
        }).html(tab.el)
        .appendTo(tabs.find('> .tab-content'));
        tab_link.on('shown.bs.tab', function() {
            Sao.View.resize(tab.el);
        });
        tab_link.tab('show');
        tabs.trigger('ready');
    };

    Sao.Tab.Form = Sao.class_(Sao.Tab, {
        class_: 'tab-form',
        init: function(model_name, attributes) {
            Sao.Tab.Form._super.init.call(this);
            var screen = new Sao.Screen(model_name, attributes);
            screen.tab = this;
            this.screen = screen;
            this.attributes = jQuery.extend({}, attributes);

            this.info_bar = new Sao.Window.InfoBar();
            this.create_tabcontent();

            this.set_buttons_sensitive();

            this.view_prm = this.screen.switch_view().done(function() {
                this.set_name(attributes.name ||
                        this.screen.current_view.attributes.string);
                this.el.append(screen.screen_container.el);
                if (attributes.res_id) {
                    screen.group.load([attributes.res_id]);
                    screen.set_current_record(
                        screen.group.get(attributes.res_id));
                    screen.display();
                } else {
                    if (screen.current_view.view_type == 'form') {
                        screen.new_();
                    }
                    if (~['tree', 'graph', 'calendar'].indexOf(
                            screen.current_view.view_type)) {
                        screen.search_filter();
                    }
                }
                this.update_revision();
            }.bind(this));
        },
        toolbar_def: function() {
            return [
                ['new', 'glyphicon-edit',
                Sao.i18n.gettext('New'),
                Sao.i18n.gettext('Create a new record'), 'new_'],
                ['save', 'glyphicon-save',
                Sao.i18n.gettext('Save'),
                Sao.i18n.gettext('Save this record'), 'save'],
                ['switch', 'glyphicon-list-alt',
                Sao.i18n.gettext('Switch'),
                Sao.i18n.gettext('Switch view'), 'switch_'],
                ['reload', 'glyphicon-refresh',
                Sao.i18n.gettext('Reload'),
                Sao.i18n.gettext('Reload'), 'reload'],
                ['previous', 'glyphicon-chevron-left',
                Sao.i18n.gettext('Previous'),
                Sao.i18n.gettext('Previous Record'), 'previous'],
                ['next', 'glyphicon-chevron-right',
                Sao.i18n.gettext('Next'),
                Sao.i18n.gettext('Next Record'), 'next'],
                ['attach', 'glyphicon-paperclip',
                Sao.i18n.gettext('Attachment'),
                Sao.i18n.gettext('Add an attachment to the record'), 'attach'],
                ['note', 'glyphicon-comment',
                Sao.i18n.gettext('Note'),
                Sao.i18n.gettext('Add a note to the record'), 'note']
            ];
        },
        menu_def: function() {
            return [
                ['glyphicon-edit', Sao.i18n.gettext('New'), 'new_'],
                ['glyphicon-save', Sao.i18n.gettext('Save'), 'save'],
                ['glyphicon-list-alt', Sao.i18n.gettext('Switch'), 'switch_'],
                ['glyphicon-refresh', Sao.i18n.gettext('Reload/Undo'),
                    'reload'],
                ['glyphicon-duplicate', Sao.i18n.gettext('Duplicate'), 'copy'],
                ['glyphicon-trash', Sao.i18n.gettext('Delete'), 'delete_'],
                ['glyphicon-chevron-left', Sao.i18n.gettext('Previous'),
                    'previous'],
                ['glyphicon-chevron-right', Sao.i18n.gettext('Next'), 'next'],
                ['glyphicon-search', Sao.i18n.gettext('Search'), 'search'],
                ['glyphicon-time', Sao.i18n.gettext('View Logs...'), 'logs'],
                ['glyphicon-time', Sao.i18n.gettext('Show revisions...'),
                    Sao.common.MODELHISTORY.contains(this.screen.model_name) ?
                        'revision' : null],
                ['glyphicon-remove', Sao.i18n.gettext('Close Tab'), 'close'],
                ['glyphicon-paperclip', Sao.i18n.gettext('Attachment'),
                    'attach'],
                ['glyphicon-comment', Sao.i18n.gettext('Note'), 'note'],
                ['glyphicon-cog', Sao.i18n.gettext('Action'), 'action'],
                ['glyphicon-share-alt', Sao.i18n.gettext('Relate'), 'relate'],
                ['glyphicon-print', Sao.i18n.gettext('Print'), 'print'],
                ['glyphicon-export', Sao.i18n.gettext('Export'), 'export'],
                ['glyphicon-import', Sao.i18n.gettext('Import'), 'import']
            ];
        },
        create_toolbar: function() {
            var toolbar = Sao.Tab.Form._super.create_toolbar.call(this);
            var screen = this.screen;
            var buttons = this.buttons;
            var prm = screen.model.execute('view_toolbar_get', [],
                    screen.context);
            prm.done(function(toolbars) {
                [
                ['action', 'glyphicon-cog',
                    Sao.i18n.gettext('Action'),
                    Sao.i18n.gettext('Launch action')],
                ['relate', 'glyphicon-share-alt',
                     Sao.i18n.gettext('Relate'),
                     Sao.i18n.gettext('Open related records')],
                ['print', 'glyphicon-print',
                     Sao.i18n.gettext('Print'),
                     Sao.i18n.gettext('Print report')]
                ].forEach(function(menu_action) {
                    var button = jQuery('<li/>', {
                        'class': 'dropdown'
                    })
                    .append(jQuery('<a/>', {
                        href: '#',
                        id: menu_action[0],
                        'class': 'dropdown-toggle',
                        'data-toggle': 'dropdown',
                        role: 'button',
                        'aria-expanded': 'false'
                    })
                        .append(jQuery('<span/>', {
                            'class': 'glyphicon ' + menu_action[1],
                            'aria-hidden': 'true'
                        }))
                        .append(jQuery('<span/>', {
                            'class': 'hidden-sm'
                        }).append(' ' + menu_action[2] + ' '))
                        .append(jQuery('<span/>', {
                            'class': 'caret'
                        })))
                    .append(jQuery('<ul/>', {
                        'class': 'dropdown-menu',
                        role: 'menu',
                        'aria-labelledby': menu_action[0]
                    }))
                    .appendTo(toolbar.find('.navbar-collapse > ul'));
                    buttons[menu_action[0]] = button;
                    var menu = button.find('ul[role*="menu"]');
                    if (menu_action[0] == 'action') {
                        button.find('a').click(function() {
                            menu.find('.action_button').remove();
                            var buttons = screen.get_buttons();
                            buttons.forEach(function(button) {
                                var item = jQuery('<li/>', {
                                    'role': 'presentation',
                                    'class': 'action_button'
                                })
                                .append(
                                    jQuery('<a/>', {
                                        'role': 'menuitem',
                                        'href': '#',
                                        'tabindex': -1
                                    }).append(
                                        button.attributes.string || ''))
                                .click(function() {
                                    screen.button(button.attributes);
                                })
                            .appendTo(menu);
                            });
                        });
                    }

                    toolbars[menu_action[0]].forEach(function(action) {
                        var item = jQuery('<li/>', {
                            'role': 'presentation'
                        })
                        .append(jQuery('<a/>', {
                            'role': 'menuitem',
                            'href': '#',
                            'tabindex': -1
                        }).append(action.name))
                        .click(function() {
                            screen.save_current().then(function() {
                                var exec_action = jQuery.extend({}, action);
                                var record_id = null;
                                if (screen.current_record) {
                                    record_id = screen.current_record.id;
                                }
                                var record_ids = screen.current_view
                                .selected_records().map(function(record) {
                                    return record.id;
                                });
                                exec_action = Sao.Action.evaluate(exec_action,
                                    menu_action[0], screen.current_record);
                                var data = {
                                    model: screen.model_name,
                                    id: record_id,
                                    ids: record_ids
                                };
                                Sao.Action.exec_action(exec_action, data,
                                    screen.context);
                            });
                        })
                        .appendTo(menu);
                    });
                });
            });
            return toolbar;
        },
        _close_allowed: function() {
            return this.modified_save();
        },
        modified_save: function() {
            this.screen.save_tree_state();
            this.screen.current_view.set_value();
            if (this.screen.modified()) {
                return Sao.common.sur_3b.run(
                        Sao.i18n.gettext('This record has been modified\n' +
                            'do you want to save it?'))
                    .then(function(result) {
                        switch(result) {
                            case 'ok':
                                return this.save();
                            case 'ko':
                                return this.reload(false);
                            default:
                                return jQuery.Deferred().reject();
                        }
                    }.bind(this));
            }
            return jQuery.when();
        },
        new_: function() {
            if (!Sao.common.MODELACCESS.get(this.screen.model_name).create) {
                return;
            }
            this.modified_save().done(function() {
                this.screen.new_().then(function() {
                    this.info_bar.message();
                }.bind(this));
                // TODO activate_save
            }.bind(this));
        },
        save: function() {
            var access = Sao.common.MODELACCESS.get(this.screen.model_name);
            if (!(access.write || access.create)) {
                return jQuery.when();
            }
            return this.screen.save_current().then(
                    function() {
                        this.info_bar.message(
                                Sao.i18n.gettext('Record saved.'), 'info');
                    }.bind(this),
                    function() {
                        this.info_bar.message(
                            this.screen.invalid_message(), 'danger');
                    }.bind(this));
        },
        switch_: function() {
            this.modified_save().done(function() {
                this.screen.switch_view();
            }.bind(this));
        },
        reload: function(test_modified) {
            if (test_modified === undefined) {
                test_modified = true;
            }
            var reload = function() {
                return this.screen.cancel_current().then(function() {
                    this.screen.save_tree_state(false);
                    if (this.screen.current_view.view_type != 'form') {
                        this.screen.search_filter(
                            this.screen.screen_container.search_entry.val());
                        // TODO set current_record
                    }
                    return this.screen.display().then(function() {
                        this.info_bar.message();
                    }.bind(this));
                    // TODO activate_save
                }.bind(this));
            }.bind(this);
            if (test_modified) {
                return this.modified_save().then(reload);
            } else {
                return reload();
            }
        },
        copy: function() {
            if (!Sao.common.MODELACCESS.get(this.screen.model_name).create) {
                return;
            }
            this.modified_save().done(function() {
                this.screen.copy().then(function() {
                    this.info_bar.message(
                            Sao.i18n.gettext(
                                'Working now on the duplicated record(s).'),
                            'info');
                }.bind(this));
            }.bind(this));
        },
        delete_: function() {
            if (!Sao.common.MODELACCESS.get(this.screen.model_name)['delete']) {
                return;
            }
            var msg;
            if (this.screen.current_view.view_type == 'form') {
                msg = Sao.i18n.gettext('Are you sure to remove this record?');
            } else {
                msg = Sao.i18n.gettext('Are you sure to remove those records?');
            }
            Sao.common.sur.run(msg).done(function() {
                this.screen.remove(true, false, true).then(
                        function() {
                            this.info_bar.message(
                                    Sao.i18n.gettext('Records removed.'),
                                    'info');
                        }.bind(this), function() {
                            this.info_bar.message(
                                    Sao.i18n.gettext('Records not removed.'),
                                    'danger');
                        }.bind(this));
            }.bind(this));
        },
        previous: function() {
            this.modified_save().done(function() {
                this.screen.display_previous();
                this.info_bar.message();
                // TODO activate_save
            }.bind(this));
        },
        next: function() {
            this.modified_save().done(function() {
                this.screen.display_next();
                this.info_bar.message();
                // TODO activate_save
            }.bind(this));
        },
        search: function() {
            var search_entry = this.screen.screen_container.search_entry;
            if (search_entry.is(':visible')) {
                window.setTimeout(function() {
                    search_entry.focus();
                }, 0);
            }
        },
        logs: function() {
            var record = this.screen.current_record;
            if ((!record) || (record.id < 0)) {
                this.info_bar.message(
                        Sao.i18n.gettext('You have to select one record.'),
                        'info');
                return;
            }
            var fields = [
                ['id', Sao.i18n.gettext('ID:')],
                ['create_uid.rec_name',
                    Sao.i18n.gettext('Creation User:')],
                ['create_date', Sao.i18n.gettext('Creation Date:')],
                ['write_uid.rec_name',
                    Sao.i18n.gettext('Latest Modification by:')],
                ['write_date', Sao.i18n.gettext('Latest Modification Date:')]
                ];

            this.screen.model.execute('read', [[record.id],
                    fields.map(function(field) {
                        return field[0];
                    })], this.screen.context)
            .then(function(result) {
                result = result[0];
                var message = '';
                fields.forEach(function(field) {
                    var key = field[0];
                    var label = field[1];
                    var value = result[key] || '/';
                    if (result[key] &&
                        ~['create_date', 'write_date'].indexOf(key)) {
                        value = Sao.common.format_datetime(
                            Sao.common.date_format(),
                            '%H:%M:%S',
                            value);
                    }
                    message += label + ' ' + value + '\n';
                });
                message += Sao.i18n.gettext('Model: ') + this.screen.model.name;
                Sao.common.message.run(message);
            }.bind(this));
        },
        revision: function() {
            var current_id = null;
            if (this.screen.current_record) {
                current_id = this.screen.current_record.id;
            }
            var set_revision = function(revisions) {
                return function(revision) {
                    if (revision) {
                        // Add a millisecond as microseconds are truncated
                        revision.add(1, 'milliseconds');
                    }
                    if ((this.screen.current_view.view_type == 'form') &&
                            (revision < revisions[revisions.length - 1][0])) {
                        revision = revisions[revisions.length - 1][0];
                    }
                    if (revision != this.screen.context._datetime) {
                        // Update screen context that will be propagated by
                        // recreating new group
                        this.screen.context._datetime = revision;
                        if (this.screen.current_view.view_type != 'form') {
                            this.screen.search_filter(
                                    this.screen.screen_container
                                    .search_entry.val());
                        } else {
                            // Test if record exist in revisions
                            this.screen.new_group([current_id]);
                        }
                        this.screen.display(true);
                        this.update_revision();
                    }
                }.bind(this);
            }.bind(this);
            this.modified_save().done(function() {
                var ids = this.screen.current_view.selected_records().map(
                    function(record) {
                        return record.id;
                    });
                this.screen.model.execute('history_revisions',
                    [ids], this.screen.context)
                    .then(function(revisions) {
                        new Sao.Window.Revision(revisions, set_revision(revisions));
                    });
            }.bind(this));
        },
        update_revision: function() {
            var revision = this.screen.context._datetime;
            var label;
            if (revision) {
                var date_format = Sao.common.date_format();
                var time_format = '%H:%M:%S.%f';
                revision = Sao.common.format_datetime(date_format, time_format,
                        revision);
                label = this.name_el.text() + ' @ '+ revision;
            } else {
                label = this.name_el.text();
            }
            this.title.html(label);
            this.set_buttons_sensitive(revision);
        },
        set_buttons_sensitive: function(revision) {
            if (!revision) {
                var access = Sao.common.MODELACCESS.get(this.screen.model_name);
                [['new', access.create],
                ['save', access.create || access.write]
                ].forEach(function(e) {
                    var button = e[0];
                    var access = e[1];
                    if (access) {
                        this.buttons[button].parent().removeClass('disabled');
                    } else {
                        this.buttons[button].parent().addClass('disabled');
                    }
                }.bind(this));
            } else {
                ['new', 'save'].forEach(function(button) {
                    this.buttons[button].parent().addClass('disabled');
                }.bind(this));
            }
        },
        attach: function() {
            var record = this.screen.current_record;
            if (!record || (record.id < 0)) {
                return;
            }
            new Sao.Window.Attachment(record, function() {
                this.update_attachment_count(true);
            }.bind(this));
        },
        update_attachment_count: function(reload) {
            var record = this.screen.current_record;
            if (record) {
                record.get_attachment_count(reload).always(
                        this.attachment_count.bind(this));
            } else {
                this.attachment_count(0);
            }
        },
        attachment_count: function(count) {
            var label = Sao.i18n.gettext('Attachment(%1)', count);
            this.buttons.attach.text(label);
            var record_id = this.screen.get_id();
            this.buttons.attach.prop('disabled',
                record_id < 0 || record_id === null);
        },
        note: function() {
            var record = this.screen.current_record;
            if (!record || (record.id < 0)) {
                return;
            }
            new Sao.Window.Note(record, function() {
                this.update_unread_note(true);
            }.bind(this));
        },
        update_unread_note: function(reload) {
            var record = this.screen.current_record;
            if (record) {
                record.get_unread_note(reload).always(
                        this._unread_note.bind(this));
            } else {
                this._unread_note(0);
            }
        },
        _unread_note: function(unread) {
            var label = Sao.i18n.gettext('Note(%1)', unread);
            this.buttons.note.text(label);
            var record_id = this.screen.get_id();
            this.buttons.note.prop('disabled',
                    record_id < 0 || record_id === null);
        },
        record_message: function() {
            this.info_bar.message();
        },
        action: function() {
            window.setTimeout(function() {
                this.buttons.action.find('ul.dropdown-menu')
                    .dropdown('toggle');
            }.bind(this));
        },
        relate: function() {
            window.setTimeout(function() {
                this.buttons.relate.find('ul.dropdown-menu')
                    .dropdown('toggle');
            }.bind(this));
        },
        print: function() {
            window.setTimeout(function() {
                this.buttons.print.find('ul.dropdown-menu')
                    .dropdown('toggle');
            }.bind(this));
        },
        export: function(){
            this.info_bar.message(Sao.i18n.gettext("Export"));
        },
        import: function(){
            new Sao.Window.Import(this.screen.current_record);
        }
    });

    Sao.Tab.Board = Sao.class_(Sao.Tab, {
        class_: 'tab-board',
        init: function(attributes) {
            var UIView, view_prm;
            Sao.Tab.Board._super.init.call(this);
            this.model = attributes.model;
            this.view_id = (attributes.view_ids.length > 0 ?
                    attributes.view_ids[0] : null);
            this.context = attributes.context;
            this.name = attributes.name;
            this.dialogs = [];
            this.board = null;
            UIView = new Sao.Model('ir.ui.view');
            view_prm = UIView.execute('read', [[this.view_id], ['arch']],
                    this.context);
            view_prm.done(function(views) {
                var view, board;
                view = jQuery(jQuery.parseXML(views[0].arch));
                this.board = new Sao.View.Board(view, this.context);
                this.board.actions_prms.done(function() {
                    var i, len, action;
                    for (i = 0, len = this.board.actions.length; i < len; i++) {
                        action = this.board.actions[i];
                        action.screen.tab = this;
                    }
                }.bind(this));
                this.el.append(this.board.el);
            }.bind(this));
            this.create_tabcontent();
            this.set_name(this.name);
            this.title.html(this.name_el.text());
        },
        toolbar_def: function() {
            return [
                ['reload', 'glyphicon-refresh',
                Sao.i18n.gettext('Reload'),
                Sao.i18n.gettext('Reload'), 'reload']
            ];
        },
        menu_def: function() {
            return [
                ['glyphicon-refresh', Sao.i18n.gettext('Reload/Undo'), 'reload']
            ];
        },
        reload: function() {
            this.board.reload();
        },
        record_message: function() {
            var i, len;
            var action;

            len = this.board.actions.length;
            for (i = 0, len=len; i < len; i++) {
                action = this.board.actions[i];
                action.update_domain(this.board.actions);
            }
        },
        attachment_count: function() {
        },
        note: function() {
        },
        update_unread_note: function() {
        }
    });

    Sao.Tab.Wizard = Sao.class_(Sao.Tab, {
        class_: 'tab-wizard',
        init: function(wizard) {
            Sao.Tab.Wizard._super.init.call(this);
            this.wizard = wizard;
            this.set_name(wizard.name);
            wizard.tab = this;
            this.create_tabcontent();
            this.title.html(this.name_el.text());
            this.el.append(wizard.form);
        },
        create_toolbar: function() {
            return jQuery('<span/>');
        },
        _close_allowed: function() {
            var wizard = this.wizard;
            var prm = jQuery.when();
            if ((wizard.state !== wizard.end_state) &&
                (wizard.end_state in wizard.states)) {
                prm = wizard.response(wizard.end_state);
            }
            var dfd = jQuery.Deferred();
            prm.always(function() {
                if (wizard.state === wizard.end_state) {
                    dfd.resolve();
                } else {
                    dfd.reject();
                }
            });
            return dfd.promise();
        }
    });
}());
