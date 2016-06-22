/* This file is part of Tryton.  The COPYRIGHT file at the top level of
   this repository contains the full copyright notices and license terms. */
(function() {
    'use strict';

    Sao.Window = {};

    Sao.Window.InfoBar = Sao.class_(Object, {
        init: function() {
            this.text = jQuery('<span/>');
            this.text.css('white-space', 'pre-wrap');
            this.el = jQuery('<div/>', {
                'class': 'alert',
                'role': 'alert'
            }).append(jQuery('<button/>', {
                'type': 'button',
                'class': 'close',
                'aria-label': Sao.i18n.gettext('Close')
            }).append(jQuery('<span/>', {
                'aria-hidden': true
            }).append('&times;')).click(function() {
                this.el.hide();
            }.bind(this))).append(this.text);
            this.el.hide();
        },
        message: function(message, type) {
            if (message) {
                this.el.removeClass(
                        'alert-success alert-info alert-warning alert-danger');
                this.el.addClass('alert-' + (type || 'info'));
                this.text.text(message);
                this.el.show();
            } else {
                this.el.hide();
            }
        }
    });

    Sao.Window.Form = Sao.class_(Object, {
        init: function(screen, callback, kwargs) {
            kwargs = kwargs || {};
            this.screen = screen;
            this.callback = callback;
            this.many = kwargs.many || 0;
            this.domain = kwargs.domain || null;
            this.context = kwargs.context || null;
            this.save_current = kwargs.save_current;
            this.prev_view = screen.current_view;
            this.screen.screen_container.alternate_view = true;
            this.info_bar = new Sao.Window.InfoBar();
            var view_type = kwargs.view_type || 'form';

            var form_prm = jQuery.when();
            var screen_views = [];
            for (var i = 0, len = this.screen.views.length; i < len; i++) {
                screen_views.push(this.screen.views[i].view_type);
            }
            if (!~screen_views.indexOf(view_type) &&
                !~this.screen.view_to_load.indexOf(view_type)) {
                form_prm = this.screen.add_view_id(null, view_type);
            }

            var switch_prm = form_prm.then(function() {
                return this.screen.switch_view(view_type).done(function() {
                    if (kwargs.new_) {
                        this.screen.new_();
                    }
                }.bind(this));
            }.bind(this));
            var dialog = new Sao.Dialog('', '', 'lg');
            this.el = dialog.modal;

            dialog.body.append(this.info_bar.el);

            var readonly = (this.screen.attributes.readonly ||
                    this.screen.group.get_readonly());

            if (view_type == 'form') {
                dialog.footer.append(jQuery('<button/>', {
                    'class': 'btn btn-link',
                    'type': 'button'
                }).append(!kwargs.new_ && this.screen.current_record.id < 0 ?
                    Sao.i18n.gettext('Delete') : Sao.i18n.gettext('Cancel'))
                        .click(function() {
                            this.response('RESPONSE_CANCEL');
                        }.bind(this)));
            }

            if (kwargs.new_ && this.many) {
                dialog.footer.append(jQuery('<button/>', {
                    'class': 'btn btn-default',
                    'type': 'button'
                }).append(Sao.i18n.gettext('New')).click(function() {
                    this.response('RESPONSE_ACCEPT');
                }.bind(this)));
            }

            if (this.save_current) {
                dialog.footer.append(jQuery('<button/>', {
                    'class': 'btn btn-primary',
                    'type': 'submit'
                }).append(Sao.i18n.gettext('Save')));
            } else {
                dialog.footer.append(jQuery('<button/>', {
                    'class': 'btn btn-primary',
                    'type': 'submit'
                }).append(Sao.i18n.gettext('OK')));
            }
            dialog.content.submit(function(e) {
                this.response('RESPONSE_OK');
                e.preventDefault();
            }.bind(this));

            if (view_type == 'tree') {
                var menu = jQuery('<div/>').appendTo(dialog.body);
                var group = jQuery('<div/>', {
                    'class': 'input-group input-group-sm'
                }).appendTo(menu);

                this.wid_text = jQuery('<input/>', {
                    type: 'input'
                }).appendTo(menu);
                this.wid_text.hide();

                var buttons = jQuery('<div/>', {
                    'class': 'input-group-btn'
                }).appendTo(group);
                var access = Sao.common.MODELACCESS.get(this.screen.model_name);
                if (this.domain) {
                    this.wid_text.show();

                    this.but_add = jQuery('<button/>', {
                        'class': 'btn btn-default btn-sm',
                        'type': 'button',
                        'aria-label': Sao.i18n.gettext('Add')
                    }).append(jQuery('<span/>', {
                        'class': 'glyphicon glyphicon-plus'
                    })).appendTo(buttons);
                    this.but_add.click(this.add.bind(this));
                    this.but_add.prop('disabled', !access.read || readonly);

                    this.but_remove = jQuery('<button/>', {
                        'class': 'btn btn-default btn-sm',
                        'type': 'button',
                        'aria-label': Sao.i18n.gettext('Remove')
                    }).append(jQuery('<span/>', {
                        'class': 'glyphicon glyphicon-minus'
                    })).appendTo(buttons);
                    this.but_remove.click(this.remove.bind(this));
                    this.but_remove.prop('disabled', !access.read || readonly);
                }

                this.but_new = jQuery('<button/>', {
                    'class': 'btn btn-default btn-sm',
                    'type': 'button',
                    'aria-label': Sao.i18n.gettext('New')
                }).append(jQuery('<span/>', {
                    'class': 'glyphicon glyphicon-edit'
                })).appendTo(buttons);
                this.but_new.click(this.new_.bind(this));
                this.but_new.prop('disabled', !access.create || readonly);

                this.but_del = jQuery('<button/>', {
                    'class': 'btn btn-default btn-sm',
                    'type': 'button',
                    'aria-label': Sao.i18n.gettext('Delete')
                }).append(jQuery('<span/>', {
                    'class': 'glyphicon glyphicon-trash'
                })).appendTo(buttons);
                this.but_del.click(this.delete_.bind(this));
                this.but_del.prop('disabled', !access['delete'] || readonly);

                this.but_undel = jQuery('<button/>', {
                    'class': 'btn btn-default btn-sm',
                    'type': 'button',
                    'aria-label': Sao.i18n.gettext('Undelete')
                }).append(jQuery('<span/>', {
                    'class': 'glyphicon glyphicon-repeat'
                })).appendTo(buttons);
                this.but_undel.click(this.undelete.bind(this));
                this.but_undel.prop('disabled', !access['delete'] || readonly);

                this.but_previous = jQuery('<button/>', {
                    'class': 'btn btn-default btn-sm',
                    'type': 'button',
                    'aria-label': Sao.i18n.gettext('Previous')
                }).append(jQuery('<span/>', {
                    'class': 'glyphicon glyphicon-chevron-left'
                })).appendTo(buttons);
                this.but_previous.click(this.previous.bind(this));

                this.label = jQuery('<span/>', {
                    'class': 'btn'
                }).appendTo(buttons);
                this.label.text('(0, 0)');

                this.but_next = jQuery('<button/>', {
                    'class': 'btn btn-default btn-sm',
                    'type': 'button',
                    'aria-label': Sao.i18n.gettext('Next')
                }).append(jQuery('<span/>', {
                    'class': 'glyphicon glyphicon-chevron-right'
                })).appendTo(buttons);
                this.but_next.click(this.next.bind(this));

                this.but_switch = jQuery('<button/>', {
                    'class': 'btn btn-default btn-sm',
                    'type': 'button',
                    'aria-label': Sao.i18n.gettext('Switch')
                }).append(jQuery('<span/>', {
                    'class': 'glyphicon glyphicon-list-alt'
                })).appendTo(buttons);
                this.but_switch.click(this.switch_.bind(this));
            }


            switch_prm.done(function() {
                dialog.add_title(this.screen.current_view.attributes.string);
                dialog.body.append(this.screen.screen_container.alternate_viewport);
                this.el.modal('show');
            }.bind(this));
            this.el.on('shown.bs.modal', function(event) {
                this.screen.display().done(function() {
                    this.screen.set_cursor();
                }.bind(this));
            }.bind(this));
            this.el.on('hidden.bs.modal', function(event) {
                jQuery(this).remove();
            });

        },
        add: function() {
            var domain = jQuery.extend([], this.domain);
            var model_name = this.screen.model_name;
            var value = this.wid_text.val();

            var callback = function(result) {
                var prm = jQuery.when();
                if (!jQuery.isEmptyObject(result)) {
                    var ids = [];
                    for (var i = 0, len = result.length; i < len; i++) {
                        ids.push(result[i][0]);
                    }
                    this.screen.group.load(ids, true);
                    prm = this.screen.display();
                }
                prm.done(function() {
                    this.screen.set_cursor();
                }.bind(this));
                this.entry.val('');
            }.bind(this);
            var parser = new Sao.common.DomainParser();
            var win = new Sao.Window.Search(model_name, callback, {
                sel_multi: true,
                context: this.context,
                domain: domain,
                search_filter: parser.quote(value)
            });
        },
        remove: function() {
            this.screen.remove(false, true, false);
        },
        new_: function() {
            this.screen.new_();
        },
        delete_: function() {
            this.screen.remove(false, false, false);
        },
        undelete: function() {
            this.screen.unremove();
        },
        previous: function() {
            this.screen.display_previous();
        },
        next: function() {
            this.screen.display_next();
        },
        switch_: function() {
            this.screen.switch_view();
        },
        response: function(response_id) {
            var result;
            this.screen.current_view.set_value();
            var readonly = this.screen.group.get_readonly();
            if (~['RESPONSE_OK', 'RESPONSE_ACCEPT'].indexOf(response_id) &&
                    !readonly &&
                    this.screen.current_record) {
                this.screen.current_record.validate().then(function(validate) {
                    if (validate && this.screen.attributes.pre_validate) {
                        return this.screen.current_record.pre_validate();
                    }
                    return validate;
                }.bind(this)).then(function(validate) {
                    var closing_prm = jQuery.Deferred();
                    if (validate && this.save_current) {
                        this.screen.save_current().then(closing_prm.resolve,
                            closing_prm.reject);
                    } else if (validate &&
                            this.screen.current_view.view_type == 'form') {
                        var view = this.screen.current_view;
                        var validate_prms = [];
                        for (var name in view.widgets) {
                            var widget = view.widgets[name];
                            if (widget.screen &&
                                widget.screen.attributes.pre_validate) {
                                var record = widget.screen.current_record;
                                if (record) {
                                    validate_prms.push(record.pre_validate());
                                }
                            }
                        }
                        jQuery.when.apply(jQuery, validate_prms).then(
                            closing_prm.resolve, closing_prm.reject);
                    } else if (!validate) {
                        this.info_bar.message(
                            this.screen.invalid_message(), 'danger');
                        closing_prm.reject();
                    } else {
                        this.info_bar.message();
                        closing_prm.resolve();
                    }

                    closing_prm.fail(function() {
                        this.screen.display().done(function() {
                            this.screen.set_cursor();
                        }.bind(this));
                    }.bind(this));

                    // TODO Add support for many
                    closing_prm.done(function() {
                        if (response_id == 'RESPONSE_ACCEPT') {
                            this.screen.new_();
                            this.screen.current_view.display().done(function() {
                                this.screen.set_cursor();
                            }.bind(this));
                            this.many -= 1;
                            if (this.many === 0) {
                                this.but_new.prop('disabled', true);
                            }
                        } else {
                            result = true;
                            this.callback(result);
                            this.destroy();
                        }
                    }.bind(this));
                }.bind(this));
                return;
            }

            if (response_id == 'RESPONSE_CANCEL' &&
                    !readonly &&
                    this.screen.current_record) {
                result = false;
                if ((this.screen.current_record.id < 0) || this.save_current) {
                    this.screen.group.remove(this.screen.current_record, true);
                } else if (this.screen.current_record.has_changed()) {
                    this.screen.current_record.cancel();
                    this.screen.current_record.reload().always(function() {
                        this.callback(result);
                        this.destroy();
                    }.bind(this));
                    return;
                }
            } else {
                result = response_id != 'RESPONSE_CANCEL';
            }
            this.callback(result);
            this.destroy();
        },
        destroy: function() {
            this.screen.screen_container.alternate_view = false;
            this.screen.screen_container.alternate_viewport.children()
                .detach();
            if (this.prev_view) {
                // Empty when opening from Many2One
                this.screen.switch_view(this.prev_view.view_type);
            }
            this.el.modal('hide');
        }
    });

    Sao.Window.Attachment = Sao.class_(Sao.Window.Form, {
        init: function(record, callback) {
            this.resource = record.model.name + ',' + record.id;
            this.attachment_callback = callback;
            var context = jQuery.extend({}, record.get_context());
            context.resource = this.resource;
            var screen = new Sao.Screen('ir.attachment', {
                domain: [['resource', '=', this.resource]],
                mode: ['tree', 'form'],
                context: context,
                exclude_field: 'resource'
            });
            screen.switch_view().done(function() {
                screen.search_filter();
            });
            Sao.Window.Attachment._super.init.call(this, screen, this.callback,
                {view_type: 'tree'});
        },
        callback: function(result) {
            var prm = jQuery.when();
            if (result) {
                var resource = this.screen.group.model.fields.resource;
                this.screen.group.forEach(function(record) {
                    resource.set_client(record, this.resource);
                }.bind(this));
                prm = this.screen.group.save();
            }
            if (this.attachment_callback) {
                prm.always(this.attachment_callback.bind(this));
            }
        }
    });

    Sao.Window.Note = Sao.class_(Sao.Window.Form, {
        init: function(record, callback) {
            this.resource = record.model.name + ',' + record.id;
            this.note_callback = callback;
            var context = record.get_context();
            context.resource = this.resource;
            var screen = new Sao.Screen('ir.note', {
                domain: [['resource', '=', this.resource]],
                mode: ['tree', 'form'],
                context: context,
                exclude_field: 'resource'
            });
            screen.switch_view().done(function() {
                screen.search_filter();
            });
            Sao.Window.Note._super.init.call(this, screen, this.callback,
                    {view_type: 'tree'});
        },
        callback: function(result) {
            var prm = jQuery.when();
            if (result) {
                var resource = this.screen.group.model.fields.resource;
                var unread = this.screen.group.model.fields.unread;
                this.screen.group.forEach(function(record) {
                    if (record.get_loaded() || record.id < 0) {
                        resource.set_client(record, this.resource);
                        if (!record._changed.unread) {
                            unread.set_client(record, false);
                        }
                    }
                }.bind(this));
                prm = this.screen.group.save();
            }
            if (this.note_callback) {
                prm.always(this.note_callback.bind(this));
            }
        }
    });

    Sao.Window.Search = Sao.class_(Object, {
        init: function(model, callback, kwargs) {
            kwargs = kwargs || {};
            var views_preload = kwargs.views_preload || {};
            this.model_name = model;
            this.domain = kwargs.domain || [];
            this.context = kwargs.context || {};
            this.sel_multi = kwargs.sel_multi;
            this.callback = callback;
            var dialog = new Sao.Dialog('Search', '', 'lg');
            this.el = dialog.modal;

            jQuery('<button/>', {
                'class': 'btn btn-link',
                'type': 'button'
            }).append(Sao.i18n.gettext('Cancel')).click(function() {
                this.response('RESPONSE_CANCEL');
            }.bind(this)).appendTo(dialog.footer);
            jQuery('<button/>', {
                'class': 'btn btn-default',
                'type': 'button'
            }).append(Sao.i18n.gettext('Find')).click(function() {
                this.response('RESPONSE_APPLY');
            }.bind(this)).appendTo(dialog.footer);
            if (kwargs.new_ && Sao.common.MODELACCESS.get(model).create) {
                jQuery('<button/>', {
                    'class': 'btn btn-default',
                    'type': 'button'
                }).append(Sao.i18n.gettext('New')).click(function() {
                    this.response('RESPONSE_ACCEPT');
                }.bind(this)).appendTo(dialog.footer);
            }
            jQuery('<button/>', {
                'class': 'btn btn-primary',
                'type': 'submit'
            }).append(Sao.i18n.gettext('OK')).appendTo(dialog.footer);
            dialog.content.submit(function(e) {
                this.response('RESPONSE_OK');
                e.preventDefault();
            }.bind(this));

            this.screen = new Sao.Screen(model, {
                mode: ['tree'],
                context: this.context,
                domain: this.domain,
                view_ids: kwargs.view_ids,
                views_preload: views_preload,
                row_activate: this.activate.bind(this)
            });
            this.screen.load_next_view().done(function() {
                this.screen.switch_view().done(function() {
                    dialog.body.append(this.screen.screen_container.el);
                    this.el.modal('show');
                    this.screen.display();
                    if (kwargs.search_filter !== undefined) {
                        this.screen.search_filter(kwargs.search_filter);
                    }
                }.bind(this));
            }.bind(this));
            this.el.on('hidden.bs.modal', function(event) {
                jQuery(this).remove();
            });
        },
        activate: function() {
            this.response('RESPONSE_OK');
        },
        response: function(response_id) {
            var records;
            var value = [];
            if (response_id == 'RESPONSE_OK') {
                records = this.screen.current_view.selected_records();
            } else if (response_id == 'RESPONSE_APPLY') {
                this.screen.search_filter();
                return;
            } else if (response_id == 'RESPONSE_ACCEPT') {
                var screen = new Sao.Screen(this.model_name, {
                    domain: this.domain,
                    context: this.context,
                    mode: ['form']
                });

                var callback = function(result) {
                    if (result) {
                        screen.save_current().then(function() {
                            var record = screen.current_record;
                            this.callback([[record.id,
                                record._values.rec_name || '']]);
                        }.bind(this), function() {
                            this.callback(null);
                        }.bind(this));
                    } else {
                        this.callback(null);
                    }
                };
                this.el.modal('hide');
                new Sao.Window.Form(screen, callback.bind(this), {
                    new_: true
                });
                return;
            }
            if (records) {
                var index, record;
                for (index in records) {
                    record = records[index];
                    value.push([record.id, record._values.rec_name || '']);
                }
            }
            this.callback(value);
            this.el.modal('hide');
        }
    });

    Sao.Window.Preferences = Sao.class_(Object, {
        init: function(callback) {
            this.callback = callback;
            var dialog = new Sao.Dialog('Preferences', '', 'lg');
            this.el = dialog.modal;

            jQuery('<button/>', {
                'class': 'btn btn-link',
                'type': 'button'
            }).append(Sao.i18n.gettext('Cancel')).click(function() {
                this.response('RESPONSE_CANCEL');
            }.bind(this)).appendTo(dialog.footer);
            jQuery('<button/>', {
                'class': 'btn btn-primary',
                'type': 'submit'
            }).append(Sao.i18n.gettext('OK')).appendTo(dialog.footer);
            dialog.content.submit(function(e) {
                this.response('RESPONSE_OK');
                e.preventDefault();
            }.bind(this));

            this.screen = new Sao.Screen('res.user', {
                mode: []
            });
            // Reset readonly set automaticly by MODELACCESS
            this.screen.attributes.readonly = false;
            this.screen.group.set_readonly(false);
            this.screen.group.skip_model_access = true;

            var set_view = function(view) {
                this.screen.add_view(view);
                this.screen.switch_view().done(function() {
                    this.screen.new_(false);
                    this.screen.model.execute('get_preferences', [false], {})
                    .then(set_preferences.bind(this), this.destroy);
                }.bind(this));
            };
            var set_preferences = function(preferences) {
                this.screen.current_record.set(preferences);
                this.screen.current_record.id =
                    this.screen.model.session.user_id;
                this.screen.current_record.validate(null, true).then(
                        function() {
                            this.screen.display(true);
                        }.bind(this));
                dialog.body.append(this.screen.screen_container.el);
                this.el.modal('show');
            };
            this.el.on('hidden.bs.modal', function(event) {
                jQuery(this).remove();
            });

            this.screen.model.execute('get_preferences_fields_view', [], {})
                .then(set_view.bind(this), this.destroy);
        },
        response: function(response_id) {
            var end = function() {
                this.destroy();
                this.callback();
            }.bind(this);
            var prm = jQuery.when();
            if (response_id == 'RESPONSE_OK') {
                prm = this.screen.current_record.validate()
                    .then(function(validate) {
                        if (validate) {
                            var values = jQuery.extend({}, this.screen.get());
                            var context = jQuery.extend({},
                                    Sao.Session.current_session.context);
                            var func = function(parameters) {
                                return {
                                    'method': 'model.res.user.set_preferences',
                                    'params': [values, parameters, context]
                                };
                            };
                            return new Sao.Login(func).run();
                        }
                    }.bind(this));
            }
            prm.done(end);
        },
        destroy: function() {
            this.el.modal('hide');
        }
    });

    Sao.Window.Revision = Sao.class_(Object, {
        init: function(revisions, callback) {
            this.callback = callback;
            var dialog = new Sao.Dialog(
                    Sao.i18n.gettext('Revision'), '', 'lg');
            this.el = dialog.modal;

            jQuery('<button/>', {
                'class': 'btn btn-link',
                'type': 'button'
            }).append(Sao.i18n.gettext('Cancel')).click(function() {
                this.response('RESPONSE_CANCEL');
            }.bind(this)).appendTo(dialog.footer);
            jQuery('<button/>', {
                'class': 'btn btn-primary',
                'type': 'submit'
            }).append(Sao.i18n.gettext('OK')).appendTo(dialog.footer);
            dialog.content.submit(function(e) {
                this.response('RESPONSE_OK');
                e.preventDefault();
            }.bind(this));

            var group = jQuery('<div/>', {
                'class': 'form-group'
            }).appendTo(dialog.body);
            jQuery('<label/>', {
                'for': 'revision',
                'text': 'Revision'
            }).appendTo(group);
            this.select = jQuery('<select/>', {
                'class': 'form-control',
                id: 'revision',
                'placeholder': Sao.i18n.gettext('Revision')
            }).appendTo(group);
            var date_format = Sao.common.date_format();
            var time_format = '%H:%M:%S.%f';
            this.select.append(jQuery('<option/>', {
                value: null,
                text: ''
            }));
            revisions.forEach(function(revision) {
                var name = revision[2];
                revision = revision[0];
                this.select.append(jQuery('<option/>', {
                    value: revision.valueOf(),
                    text: Sao.common.format_datetime(
                        date_format, time_format, revision) + ' ' + name
                }));
            }.bind(this));
            this.el.modal('show');
            this.el.on('hidden.bs.modal', function(event) {
                jQuery(this).remove();
            });
        },
        response: function(response_id) {
            var revision = null;
            if (response_id == 'RESPONSE_OK') {
                revision = this.select.val();
                if (revision) {
                    revision = Sao.DateTime(parseInt(revision, 10));
                }
            }
            this.el.modal('hide');
            this.callback(revision);
        }
    });

    Sao.Window.CSV = Sao.class_(Object, {

    });

    Sao.Window.Import = Sao.class_(Sao.Window.CSV, {
        init: function(screen){
            this.screen = screen;
            this.session = Sao.Session.current_session;
            this.fields = {};
            this.fields_data = {};
            this.fields_invert = {};

            var dialog = new Sao.Dialog(
                    Sao.i18n.gettext('Import from CSV'), '', 'lg');
            this.el = dialog.modal;

            jQuery('<button/>', {
                'class': 'btn btn-link',
                'type': 'button'
            }).append(Sao.i18n.gettext('Cancel')).click(function(){
                this.el.modal('hide');
            }.bind(this)).appendTo(dialog.footer);

            jQuery('<button/>', {
                'class': 'btn btn-primary',
                'type': 'submit'
            }).append(Sao.i18n.gettext('OK')).appendTo(dialog.footer);

            var row_fields = jQuery('<div/>', {
                'class': 'row'
            }).appendTo(dialog.body);

            jQuery('<hr>').appendTo(dialog.body);

            var column_fields_all = jQuery('<div/>', {
                'class' : 'col-md-4 column_fields'
            }).append(jQuery('<label/>',{
                'text' : Sao.i18n.gettext('All Fields')
            })).appendTo(row_fields);

            this.fields_all = jQuery('<ul/>', {
                'class' : 'list-unstyled'
            }).css('cursor', 'pointer')
            .appendTo(column_fields_all);

            this.get_fields(this.screen.model_name).done(function(fields){
                this.model_populate(fields);
            }.bind(this));

            var column_buttons = jQuery('<div/>', {
                'class' : 'col-md-4'
            }).append('<label/>').appendTo(row_fields);

            var button_add = jQuery('<button/>', {
                'class' : 'btn btn-default btn-block',
                'type' : 'button'
            }).append(jQuery('<i/>', {
                    'class': 'glyphicon glyphicon-plus'
            })).append(Sao.i18n.gettext(' Add'))
            .click(function(){
                // sig_sel
                // _sig_sel_add
                // TODO: Make them draggable to re-order
                this.fields_all.find('.selected').each(function(i, field){
                    field = jQuery(field);
                    var node = jQuery('<li/>', {
                        'field' : field.attr('field'),
                    }).html(field.attr('name')).click(function(){
                        node.toggleClass('selected');
                    }).appendTo(fields_selected);
                });  
            }.bind(this)).appendTo(column_buttons);

            jQuery('<button/>', {
                'class' : 'btn btn-default btn-block',
                'type' : 'button'
            }).append(jQuery('<i/>', {
                    'class': 'glyphicon glyphicon-minus'
            })).append(Sao.i18n.gettext(' Remove'))
            .click(function(){
                // sig_unsel
                fields_selected.children('li.selected').remove();
            }).appendTo(column_buttons);

            jQuery('<button/>', {
                'class' : 'btn btn-default btn-block',
                'type' : 'button'
            }).append(jQuery('<i/>', {
                    'class': 'glyphicon glyphicon-remove'
            })).append(Sao.i18n.gettext(' Clear'))
            .click(function(){
                // sig_unsel_all
                fields_selected.empty();
            }).appendTo(column_buttons);

            jQuery('<hr>').appendTo(column_buttons);

            jQuery('<button/>', {
                'class' : 'btn btn-default btn-block',
                'type' : 'button'
            }).append(jQuery('<i/>', {
                    'class': 'glyphicon glyphicon-search'
            })).append(Sao.i18n.gettext(' Auto-Detect'))
            .appendTo(column_buttons);

            var column_fields_selected = jQuery('<div/>', {
                'class' : 'col-md-4 column_fields'
            }).append(jQuery('<label/>',{
                'text' : Sao.i18n.gettext('Fields Selected')
            })).appendTo(row_fields);

            var fields_selected = jQuery('<ul/>', {
                'class' : 'list-unstyled'
            }).css('cursor', 'pointer').appendTo(column_fields_selected);

            var form_inline = jQuery('<div/>', {
                'class' : 'form-inline'
            }).appendTo(dialog.body);

            jQuery('<hr>').appendTo(dialog.body);
            
            var label_chooser = jQuery('<label/>', {
                'text' : Sao.i18n.gettext('File to Import'),
                'class' : 'col-sm-4 control-label',
                'for' : 'input-csv-file'
            });

            this.el_file_input = jQuery('<input/>', {
                'type' : 'file',
                'id' : 'input-csv-file'
            });

            var div_chooser = jQuery('<div>', {
                'class' : 'form-group'
            }).append(label_chooser).append(jQuery('<div/>', {
                'class' : 'col-sm-8'
            }).append(this.el_file_input))
            .appendTo(form_inline);

            var row_csv_param = jQuery('<div/>', {
                'class' : 'row'
            }).appendTo(dialog.body);

            var expander_icon = jQuery('<span/>', {
                'class' : 'glyphicon glyphicon-plus'
            }).html('&nbsp;');

            var div_label_csv_param = jQuery('<div/>', {
                'class' : 'col-md-12'
            }).append(expander_icon).append(jQuery('<label/>', {
                'text' : Sao.i18n.gettext('CSV Parameters')
            })).appendTo(row_csv_param);

            var expander_csv  = jQuery('<div/>', {
                'id' : 'expander_csv',
                'class' : 'collapse'
            }).appendTo(row_csv_param);

            div_label_csv_param.on('click', function(){
                expander_icon.toggleClass('glyphicon-plus')
                .toggleClass('glyphicon-minus');
                expander_csv.collapse('toggle');
            });

            var label_delimiter = jQuery('<label/>', {
                'text' : Sao.i18n.gettext('Delimiter:'),
                'class' : 'col-sm-2 control-label',
                'for' : 'input-delimiter'
            });

            this.el_csv_delimiter = jQuery('<input/>', {
                'type' : 'text',
                'class' : 'form-control',
                'id' : 'input-delimiter',
                'size' : '1',
                'maxlength' : '1',
                'value' : ','
            });

            var div_delimiter = jQuery('<div/>', {
                'class' : 'form-group'
            }).append(label_delimiter).append(jQuery('<div/>', {
                'class' : 'col-sm-4'
            }).append(this.el_csv_delimiter))
            .appendTo(expander_csv);

            var label_quotechar = jQuery('<label/>', {
                'text' : Sao.i18n.gettext('Quote Char:'),
                'class' : 'col-sm-2 control-label',
                'for' : 'input-quotechar'
            });

            this.el_csv_quotechar = jQuery('<input/>', {
                'type' : 'text',
                'class' : 'form-control',
                'id' : 'input-quotechar',
                'size' : '1',
                'maxlength' : '1',
                'value' : '\"'
            });            

            var div_quotechar = jQuery('<div/>', {
                'class' : 'form-group'
            }).append(label_quotechar).append(jQuery('<div/>', {
                'class' : 'col-sm-4'
            }).append(this.el_csv_quotechar))
            .appendTo(expander_csv);

            var label_encoding = jQuery('<label/>', {
                'text' : Sao.i18n.gettext('Encoding:'),
                'class' : 'col-sm-2 control-label',
                'for' : 'input-encoding'
            });

            this.el_csv_encoding = jQuery('<select/>', {
                'class' : 'form-control',
                'id' : 'input-encoding',
                'value' : 'utf_8'
            }).append(jQuery('<option>',{
                'selected' : '',
                'val' : 'utf_8'
            }).html('utf_8'));            

            var div_encoding = jQuery('<div/>', {
                'class' : 'form-group'
            }).append(label_encoding).append(jQuery('<div/>', {
                'class' : 'col-sm-4'
            }).append(this.el_csv_encoding))
            .appendTo(expander_csv);

            var label_skip = jQuery('<label/>', {
                'text' : Sao.i18n.gettext('Lines to Skip:'),
                'class' : 'col-sm-2 control-label',
                'for' : 'input-skip'
            });

            this.el_csv_skip = jQuery('<input/>', {
                'type' : 'number',
                'class' : 'form-control',
                'id' : 'input-skip',
                'value' : '1'
            });            

            var div_skip = jQuery('<div/>', {
                'class' : 'form-group'
            }).append(label_skip).append(jQuery('<div/>', {
                'class' : 'col-sm-4'
            }).append(this.el_csv_skip))
            .appendTo(expander_csv);

            this.el.modal('show');
        },
        get_fields: function(model){
            var prm = jQuery.when();
            prm = Sao.rpc({
                'method' : 'model.' + model + '.fields_get'
            }, this.session);

            return prm;
        },
        model_populate: function (fields, parent_node, prefix_field, 
            prefix_name){
                if(parent_node === undefined) parent_node = this.fields_all;
                if(prefix_field === undefined) prefix_field = '';
                if(prefix_name === undefined) prefix_name = '';

                var fields_order = Object.keys(fields);
                fields_order.sort(function(a,b){
                    return fields[a].string - fields[b].string;
                });
                
                fields_order.forEach(function(field){
                    // TODO: Show all levels of fields
                    if(!fields[field].readonly){
                        this.fields_data[prefix_field + field] = fields[field];
                        var name = fields[field].string || field;
                        var node = jQuery('<li/>', {
                            'field' : prefix_field + field,
                            'name' : prefix_name + name
                        }).html(name).click(function(){
                            node.toggleClass('selected');
                        }).appendTo(parent_node);
                        name = prefix_name + name;
                        // Only One2Many can be nested for import
                        var relation;
                        if (fields[field].type == 'one2many'){
                            relation = fields[field].relation;
                        } else {
                            relation = null;
                        }
                        this.fields_invert[name] = prefix_field + field;
                        if (relation) {
                            node.prepend(' ');
                            var expander_icon = jQuery('<i/>', {
                                'class' : 'glyphicon glyphicon-plus'
                            }).click(function(e){
                                e.stopPropagation();
                                expander_icon.toggleClass('glyphicon-plus')
                                .toggleClass('glyphicon-minus');
                                if(expander_icon[0].classList[1] ==
                                    'glyphicon-minus'){
                                    var container_node = jQuery('<ul/>')
                                    .css('list-style', 'none')
                                    .insertAfter(node);
                                    this.get_fields(relation)
                                    .done(function(child_fields){
                                        this.model_populate(
                                            child_fields,
                                            container_node,
                                            prefix_field+field+'/',
                                            name+'/'
                                        );
                                    }.bind(this));
                                } else {
                                    node.next().html('');
                                }
                            }.bind(this)).prependTo(node);
                        }
                    }
                }.bind(this));
            }
    });

}());
