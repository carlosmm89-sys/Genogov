<?php
/**
 * Plugin Name: WorkFlow AI
 * Description: Control horario y gestión laboral con IA para empleados.
 * Version: 1.0.1
 * Author: WorkFlow AI
 * Text Domain: workflow-ai
 */

if (!defined('ABSPATH')) {
    exit;
}

class WorkFlowAI_Plugin
{

    public function __construct()
    {
        add_shortcode('workflow_ai', array($this, 'render_shortcode'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
    }

    public function enqueue_scripts()
    {
        // Enqueue only if shortcode is present or globally if preferred.
        $plugin_dir = plugin_dir_path(__FILE__);
        // Changed to look in root of dist to avoid .vite hidden folder issues
        $manifest_path = $plugin_dir . 'dist/manifest.json';

        if (!file_exists($manifest_path)) {
            // Fallback for older vite versions layout or if missing
            $manifest_path = $plugin_dir . 'dist/.vite/manifest.json';
        }

        if (file_exists($manifest_path)) {
            $manifest = json_decode(file_get_contents($manifest_path), true);

            // Find the entry point (index.html's script)
            foreach ($manifest as $key => $asset) {
                if (isset($asset['isEntry']) && $asset['isEntry'] === true) {
                    $js_file = 'dist/' . $asset['file'];
                    wp_enqueue_script('workflow-ai-main', plugins_url($js_file, __FILE__), array(), '1.0.0', true);

                    if (isset($asset['css'])) {
                        foreach ($asset['css'] as $css) {
                            wp_enqueue_style('workflow-ai-style-' . md5($css), plugins_url('dist/' . $css, __FILE__), array(), '1.0.0');
                        }
                    }
                }
            }
        }
    }

    public function render_shortcode($atts)
    {
        // Ensure scripts are loaded just for this page if not global
        wp_enqueue_script('workflow-ai-main');

        // Logic to gather debug info
        $debug_output = "";
        $debug_output .= "Plugin Dir: " . plugin_dir_path(__FILE__) . "<br>";

        $dist_dir = plugin_dir_path(__FILE__) . 'dist/';
        
        if (is_dir($dist_dir)) {
            $files = scandir($dist_dir);
            // Simple check to list files
            $file_list = is_array($files) ? implode(", ", $files) : "Error scanning dir";
            $debug_output .= "<strong>Files in dist:</strong> " . $file_list . "<br>";
        } else {
            $debug_output .= "<strong style='color:red;'>Dist dir NOT FOUND.</strong><br>";
        }

        $manifest_path = $dist_dir . 'manifest.json';
        
        // Check for .vite fallback for debug info consistency
        if (!file_exists($manifest_path)) {
             $manifest_path = $dist_dir . '.vite/manifest.json';
        }

        $debug_output .= "Manifest Path: " . $manifest_path . "<br>";

        if (file_exists($manifest_path)) {
            $debug_output .= "<strong>Manifest FILE EXISTS.</strong><br>";
            $content = file_get_contents($manifest_path);
            $manifest = json_decode($content, true);
            if ($manifest) {
                foreach ($manifest as $key => $asset) {
                    if (isset($asset['isEntry']) && $asset['isEntry'] === true) {
                        $js_url = plugins_url('dist/' . $asset['file'], __FILE__);
                        $debug_output .= "<strong>Trying to Enqueue:</strong> " . $js_url . "<br>";
                    }
                }
            } else {
                $debug_output .= "JSON Decode Failed.<br>";
            }
        } else {
            $debug_output .= "<strong style='color:red;'>Manifest file NOT FOUND.</strong><br>";
        }

        // CORRECCIÓN PRINCIPAL AQUÍ:
        // Hemos cambiado el id="workflow-ai-root" por id="root" 
        // para que coincida con lo que espera tu archivo JS compilado.
        return '<div style="background: #f0fdf4; border: 2px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 8px; font-family: sans-serif;">
            <h2 style="color: #166534; margin: 0 0 10px 0; text-align: center;">¡WorkFlow AI Activo!</h2>
            
            <div id="root" style="margin-top: 20px; min-height: 200px; position: relative;">
                <p style="color: #666; text-align: center;">Cargando aplicación React...</p>
            </div>
            
            <div style="margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 11px; text-align: left; color: #555; background: #eef; padding: 10px;">
                <strong>Debug Details:</strong><br>' . $debug_output . '
            </div>
        </div>';
    }
}

new WorkFlowAI_Plugin();