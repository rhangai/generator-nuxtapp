const path = require( "path" );
const fs = require( "fs" );
const BUILD_DIR = process.env.APP_BUILD_DIR ? path.resolve( process.env.APP_BUILD_DIR ) : path.resolve( __dirname, "../../../dist" );
const ROOT_DIR  = path.resolve( __dirname, "../../../" );

/**

	Uses a new config file with:

	alias: The alias for webpack to resolve
	extend: Extends the webpack configuration
	features: Options for features
	middleware: Middlewares used by nuxt.router
	modules: Modules used by nuxt
	plugins: Plugin used by nuxt

 */

class NuxtConfigHelper {

	constructor( dir, config ) {
		this._dir     = dir;
		this._config = Object.assign( {}, config );

		this._baseDir = path.basename( dir );
	}

	generate() {
		const config = Object.assign( {}, this._config );
		config.alias      = Object.assign( {}, config.alias );
		config.css        = [].concat( config.css );
		config.extend     = [].concat( config.extend );
		config.plugins    = [].concat( config.plugins );
		config.modules    = [].concat( config.modules );
		config.middleware = [].concat( config.middleware );
		config.features   = Object.assign( {}, config.features );
		
		// The nuxt configuration
		const nuxtConfig = {
			rootDir: ROOT_DIR,
			srcDir: this._dir,
			build: {
				extend: function( webpackConfig ) {
					// Resolve alias
					if ( config.alias ) {
						for ( const key in config.alias )
							webpackConfig.resolve.alias[ key ] = config.alias[key];
					}
					config.extend.forEach( ( fn ) => { 
						fn && fn.call( this, webpackConfig ); 
					} );
				},
			},
			buildDir: path.join( BUILD_DIR, "tmp/.nuxt", this._baseDir ),
			generate: {
				dir: path.join( BUILD_DIR, "www", this._baseDir ),
			},
			modules: [],
			plugins: [],
			router:  {},
		};

		// Resolve features
		const packageJson = require( path.resolve( ROOT_DIR, 'package.json' ) );
		const helperFeatures = packageJson["nuxt-helper-features"] || [];
		helperFeatures.forEach( ( f ) => {
			const feature = require( path.resolve( __dirname, "./features", f+".js" ) );
			const featureOptions = config.features ? config.features[f] : void(0);
			feature.call( null, config, featureOptions );
		});

		// Fix configuration
		nuxtConfig.css = [].concat( config.css ).filter( Boolean );
		nuxtConfig.plugins = [].concat( config.plugins ).filter( Boolean );
		nuxtConfig.modules = [].concat( config.modules ).filter( Boolean );
		nuxtConfig.router.middleware = [].concat( config.middleware ).filter( Boolean );

		return nuxtConfig;
	}
};

// Generate the configuration
module.exports = function( dir, config ) {
	const baseDir = path.basename( dir );

	const helper = new NuxtConfigHelper( dir, config );
	return helper.generate();
};
