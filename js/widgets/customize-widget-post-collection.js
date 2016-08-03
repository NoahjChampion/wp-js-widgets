/* global wp, module, JSON */
/* eslint consistent-this: [ "error", "form" ] */
/* eslint no-magic-numbers: [ "error", {"ignore":[0,1]} ] */
/* eslint-disable strict */
/* eslint-disable complexity */

wp.customize.Widgets.formConstructor['post-collection'] = (function( api, $ ) {
	'use strict';

	var PostCollectionWidgetForm;

	/**
	 * Post Collection Widget Form.
	 *
	 * @constructor
	 */
	PostCollectionWidgetForm = api.Widgets.Form.extend({

		/**
		 * Initialize.
		 *
		 * @param {object}                             properties         Properties.
		 * @param {wp.customize.Widgets.WidgetControl} properties.control Customize control.
		 * @param {object}                             properties.config  Form config.
		 * @return {void}
		 */
		initialize: function( properties ) {
			var form = this;

			api.Widgets.Form.prototype.initialize.call( form, properties );

			form.postsItemTemplate = wp.template( 'customize-widget-post-collection-select2-option' );

			form.embed();
			form.render();
		},

		/**
		 * Embed the form from the template and set up event handlers.
		 *
		 * @return {void}
		 */
		embed: function() {
			var form = this, instance;
			form.template = wp.template( 'customize-widget-post-collection' );

			instance = form.getValue();
			form.container.html( form.template( instance ) );
			form.inputs = {
				title: form.container.find( 'input[name=title]:first' ),
				posts: form.container.find( 'select[name=posts]:first' )
			};

			form.elements = {
				title: new wp.customize.Element( form.inputs.title ),
				posts: form.inputs.posts.select2( {
					cache: false,
					width: '100%',
					ajax: {
						transport: function( params, success, failure ) {
							var request = form.queryPosts({
								s: params.data.term,
								paged: params.data.page || 1
							});
							request.done( success );
							request.fail( failure );
						}
					},
					templateResult: function( data ) {
						return form.postsItemTemplate( data );
					},
					templateSelection: function( data ) {
						return form.postsItemTemplate( data );
					},
					escapeMarkup: function( m ) {

						// Do not escape HTML in the select options text.
						return m;
					},
					disabled: true // Enabled once populated.
				} )
			};

			form.elements.title.set( instance.title );
			form.elements.title.bind( function( newTitle ) {
				form.setState( { title: newTitle } );
			} );

			form.populateSelectOptions().done( function() {
				form.elements.posts.prop( 'disabled', false );
			} );

			// Sync the select2 values with the setting values.
			form.elements.posts.on( 'change', function() {
				form.setState( {
					posts: form.getSelectedValues()
				} );
			} );

			// @todo
			// Sync the setting values with the select2 values.
			// control.setting.bind( function() {
			// 	control.populateSelectOptions();
			// } );

			form.setupSortable();
		},

		/**
		 * Get the selected values.
		 *
		 * @returns {Number[]} Selected IDs.
		 */
		getSelectedValues: function() {
			var form = this, selectValues;
			selectValues = form.elements.posts.val();
			if ( _.isEmpty( selectValues ) ) {
				selectValues = [];
			} else if ( ! _.isArray( selectValues ) ) {
				selectValues = [ selectValues ];
			}
			return _.map(
				selectValues,
				function( value ) {
					return parseInt( value, 10 );
				}
			);
		},

		/**
		 * Setup sortable.
		 *
		 * @returns {void}
		 */
		setupSortable: function() {
			var form = this, ul;

			ul = form.elements.posts.next( '.select2-container' ).first( 'ul.select2-selection__rendered' );
			ul.sortable({
				placeholder: 'ui-state-highlight',
				forcePlaceholderSize: true,
				items: 'li:not(.select2-search__field)',
				tolerance: 'pointer',
				stop: function() {
					var selectedValues = [];
					ul.find( '.select2-selection__choice' ).each( function() {
						var id, option;
						id = parseInt( $( this ).data( 'data' ).id, 10 );
						selectedValues.push( id );
						option = form.elements.posts.find( 'option[value="' + id + '"]' );
						form.elements.posts.append( option );
					});
					form.setState( {
						posts: selectedValues
					} );
				}
			});
		},

		/**
		 * Re-populate the select options based on the current setting value.
		 *
		 * @param {boolean} refresh Whether to force the refreshing of the options.
		 * @returns {jQuery.promise} Resolves when complete. Rejected when failed.
		 */
		populateSelectOptions: function( refresh ) {
			var form = this, request, settingValues, selectedValues, deferred = jQuery.Deferred();

			settingValues = form.getValue().posts;
			selectedValues = form.getSelectedValues();
			if ( ! refresh && _.isEqual( selectedValues, settingValues ) ) {
				deferred.resolve();
			} else if ( 0 === settingValues.length ) {
				form.elements.posts.empty();
				form.elements.posts.trigger( 'change' );
				deferred.resolve();
			} else {
				request = form.queryPosts({
					post__in: settingValues,
					orderby: 'post__in'
				});
				request.done( function( data ) {
					if ( form.notifications ) {
						form.notifications.remove( 'select2_init_failure' );
					}
					form.elements.posts.empty();
					_.each( data.results, function( item ) {
						var option = new Option( form.postsItemTemplate( item ), item.id, true, true );
						form.elements.posts.append( option );
					} );
					form.elements.posts.trigger( 'change' );
					deferred.resolve();
				} );
				request.fail( function() {
					var notification;
					if ( api.Notification && form.notifications ) {

						// @todo Allow clicking on this notification to re-call populateSelectOptions()
						notification = new api.Notification( 'select2_init_failure', {
							type: 'error',
							message: 'Failed to fetch selections.' // @todo l10n
						} );
						form.notifications.add( notification.code, notification );
					}
					deferred.reject();
				} );
			}
			return deferred.promise();
		},

		/**
		 * Render and update the form.
		 *
		 * @returns {void}
		 */
		render: function() {
			var form = this, instance = form.getValue();

			form.elements.title.set( instance.title );

			// @todo Update select2
		},

		/**
		 * Query posts.
		 *
		 * @param {object} queryVars Query vars.
		 * @returns {jQuery.promise} Promise.
		 */
		queryPosts: function( queryVars ) {
			var action, data, postQueryArgs = {};
			action = 'customize_object_selector_query';
			data = api.previewer.query();
			data.customize_object_selector_query_nonce = api.settings.nonce[ action ];
			_.extend(
				postQueryArgs,
				queryVars
			);
			data.post_query_args = JSON.stringify( postQueryArgs );
			return wp.ajax.post( action, data );
		},

		/**
		 * Sanitize the instance data.
		 *
		 * @param {object} oldInstance Unsanitized instance.
		 * @returns {object} Sanitized instance.
		 */
		sanitize: function( oldInstance ) {
			var form = this, newInstance;
			newInstance = _.extend( {}, oldInstance );

			if ( ! newInstance.title ) {
				newInstance.title = '';
			}

			// Warn about markup in title.
			if ( /<\/?\w+[^>]*>/.test( newInstance.title ) ) {
				form.setValidationMessage( form.config.l10n.title_tags_invalid );
			}

			return newInstance;
		}
	});

	if ( 'undefined' !== typeof module ) {
		module.exports = PostCollectionWidgetForm;
	}
	return PostCollectionWidgetForm;

})( wp.customize, jQuery );
