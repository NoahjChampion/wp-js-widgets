<?php
/**
 * Class WP_JS_Widget_Text.
 *
 * @package JSWidgets
 */

/**
 * Class WP_JS_Widget_Text
 *
 * @package JSWidgets
 */
class WP_JS_Widget_Text extends WP_JS_Widget {

	/**
	 * Proxied widget.
	 *
	 * @var WP_Widget
	 */
	public $proxied_widget;

	/**
	 * Widget constructor.
	 *
	 * @throws Exception If the `$proxied_widget` is not the expected class.
	 *
	 * @param WP_Widget $proxied_widget Proxied widget.
	 */
	public function __construct( WP_Widget $proxied_widget ) {
		if ( $proxied_widget instanceof WP_JS_Widget ) {
			throw new Exception( 'Do not proxy WP_Customize_Widget instances.' );
		}
		$this->proxied_widget = $proxied_widget;
		parent::__construct( $proxied_widget->id_base, $proxied_widget->name, $proxied_widget->widget_options, $proxied_widget->control_options );
	}

	/**
	 * Enqueue scripts needed for the control.s
	 */
	public function enqueue_control_scripts() {
		wp_enqueue_script( 'customize-widget-text' );
	}

	/**
	 * Get instance schema properties.
	 *
	 * @return array Schema.
	 */
	public function get_instance_schema() {
		$schema = array(
			'title' => array(
				'description' => __( 'The title for the widget.', 'js-widgets' ),
				'type'        => 'object',
				'context'     => array( 'view', 'edit', 'embed' ),
				'properties'  => array(
					'raw' => array(
						'description' => __( 'Title for the widget, as it exists in the database.', 'js-widgets' ),
						'type'        => 'string',
						'context'     => array( 'edit' ),
						// @todo sanitize callback
					),
					'rendered' => array(
						'description' => __( 'HTML title for the widget, transformed for display.', 'js-widgets' ),
						'type'        => 'string',
						'context'     => array( 'view', 'edit', 'embed' ),
						'readonly'    => true,
					),
				),
			),
			'text' => array(
				'description' => __( 'The content for the object.' ),
				'type'        => 'object',
				'context'     => array( 'view', 'edit' ),
				'properties'  => array(
					'raw' => array(
						'description' => __( 'Content for the widget, as it exists in the database.', 'js-widgets' ),
						'type'        => 'string',
						'context'     => array( 'edit' ),
						// @todo sanitize callback
					),
					'rendered' => array(
						'description' => __( 'HTML content for the widget, transformed for display.', 'js-widgets' ),
						'type'        => 'string',
						'context'     => array( 'view', 'edit' ),
						'readonly'    => true,
					),
				),
			),
			'filter' => array(
				'description' => __( 'Whether paragraphs will be added for double line breaks (wpautop).', 'js-widgets' ),
				'type'        => 'boolean',
				'context'     => array( 'view', 'edit' ),
				'default'     => true,
			),
		);
		return $schema;
	}

	/**
	 * Sanitize instance data.
	 *
	 * @inheritdoc
	 *
	 * @param array $new_instance New instance.
	 * @param array $args {
	 *     Additional context for sanitization.
	 *
	 *     @type array $old_instance Old instance.
	 *     @type WP_Customize_Setting $setting Setting.
	 *     @type bool $strict Validate.
	 * }
	 *
	 * @return array|null|WP_Error Array instance if sanitization (and validation) passed. Returns `WP_Error` on failure if `$strict`, and `null` otherwise.
	 */
	public function sanitize( $new_instance, $args = array() ) {

		// @todo Apply the get_instance_schema().

		$instance = $this->proxied_widget->update( $new_instance, $args['old_instance'] );
		return $instance;
	}

	/**
	 * Render JS Template.
	 *
	 * This template is intended to be agnostic to the JS template technology used.
	 */
	public function form_template() {
		?>
		<script id="tmpl-customize-widget-<?php echo esc_attr( $this->id_base ) ?>" type="text/template">
			<p>
				<label>
					<?php esc_html_e( 'Title:', 'js-widgets' ) ?>
					<input class="widefat" type="text" name="title" value="{{ data.title }}">
				</label>
			</p>
			<p>
				<label>
					<?php esc_html_e( 'Content:', 'js-widgets' ) ?>
					<textarea class="widefat" rows="16" cols="20" name="text">{{ data.text }}</textarea>
				</label>
			</p>
			<p>
				<label>
					<input type="checkbox" name="filter" <# if ( data.filter ) { #> checked <# } #> >
					<?php esc_html_e( 'Automatically add paragraphs', 'js-widgets' ); ?>
				</label>
			</p>
		</script>
		<?php
	}

	/**
	 * Render widget.
	 *
	 * @param array $args     Widget args.
	 * @param array $instance Widget instance.
	 * @return void
	 */
	public function render( $args, $instance ) {
		 $this->proxied_widget->widget( $args, $instance );
	}

	/**
	 * Get configuration data for the form.
	 *
	 * This can include information such as whether the user can do `unfiltered_html`.
	 *
	 * @return array
	 */
	public function get_form_args() {
		return array(
			'can_unfiltered_html' => current_user_can( 'unfiltered_html' ),
		);
	}
}
