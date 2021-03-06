import { getKey, normalise } from 'shared/keypaths';
import getInnerContext from 'shared/getInnerContext';

export default function resolveRef ( ractive, ref, fragment ) {
	ref = normalise( ref );

	// If a reference begins '~/', it's a top-level reference
	if ( ref.substr( 0, 2 ) === '~/' ) {
		ref = ref.substring( 2 );
		createMappingIfNecessary( ractive, getKey( ref ), fragment );
		return ref;
	}

	// If a reference begins with '.', it's either a restricted reference or
	// an ancestor reference...
	if ( ref[0] === '.' ) {
		ref = resolveAncestorRef( getInnerContext( fragment ), ref );

		if ( ref ) {
			createMappingIfNecessary( ractive, getKey( ref ), fragment );
		}

		return ref;
	}

	// ...otherwise we need to figure out the keypath based on context
	return resolveAmbiguousReference( ractive, ref, fragment );
}

function resolveAncestorRef ( baseContext, ref ) {
	var contextKeys;

	// {{.}} means 'current context'
	if ( ref === '.' ) return baseContext;

	contextKeys = baseContext ? baseContext.split( '.' ) : [];

	// ancestor references (starting "../") go up the tree
	if ( ref.substr( 0, 3 ) === '../' ) {
		while ( ref.substr( 0, 3 ) === '../' ) {
			if ( !contextKeys.length ) {
				throw new Error( 'Could not resolve reference - too many "../" prefixes' );
			}

			contextKeys.pop();
			ref = ref.substring( 3 );
		}

		contextKeys.push( ref );
		return contextKeys.join( '.' );
	}

	// not an ancestor reference - must be a restricted reference (prepended with "." or "./")
	if ( !baseContext ) {
		return ref.replace( /^\.\/?/, '' );
	}

	return baseContext + ref.replace( /^\.\//, '.' );
}

function resolveAmbiguousReference ( ractive, ref, fragment, isParentLookup ) {
	var context,
		key,
		parentValue,
		hasContextChain,
		parentKeypath;

	key = getKey( ref );

	while ( fragment ) {
		context = fragment.context;
		fragment = fragment.parent;

		if ( !context ) {
			continue;
		}

		hasContextChain = true;
		parentValue = ractive.viewmodel.get( context );

		if ( parentValue && ( typeof parentValue === 'object' || typeof parentValue === 'function' ) && key in parentValue ) {
			return context + '.' + ref;
		}
	}

	// Root/computed/mapped property?
	if ( isRootProperty( ractive, key ) ) {
		return ref;
	}

	// If this is an inline component, and it's not isolated, we
	// can try going up the scope chain
	if ( ractive.parent && !ractive.isolated ) {
		hasContextChain = true;
		fragment = ractive.component.parentFragment;

		if ( parentKeypath = resolveAmbiguousReference( ractive.parent, key, fragment, true ) ) {
			// We need to create an inter-component binding
			ractive.viewmodel.map( key, {
				origin: ractive.parent.viewmodel,
				keypath: parentKeypath
			});

			return ref;
		}
	}

	// If there's no context chain, and the instance is either a) isolated or
	// b) an orphan, then we know that the keypath is identical to the reference
	if ( !isParentLookup && !hasContextChain ) {
		// the data object needs to have a property by this name,
		// to prevent future failed lookups
		ractive.viewmodel.set( ref, undefined );
		return ref;
	}
}

function createMappingIfNecessary ( ractive, key ) {
	var parentKeypath;

	if ( !ractive.parent || ractive.isolated || isRootProperty( ractive, key ) ) {
		return;
	}

	if ( parentKeypath = resolveAmbiguousReference( ractive.parent, key, ractive.component.parentFragment, true ) ) {
		ractive.viewmodel.map( key, {
			origin: ractive.parent.viewmodel,
			keypath: parentKeypath
		});
	}
}

function isRootProperty ( ractive, key ) {
	return key in ractive.data || key in ractive.viewmodel.computations || key in ractive.viewmodel.mappings;
}