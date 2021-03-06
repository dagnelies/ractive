import { INTERPOLATOR, SECTION, TRIPLE, ELEMENT, PARTIAL, COMMENT, DOCTYPE } from 'config/types';
import Text from 'virtualdom/items/Text';
import Interpolator from 'virtualdom/items/Interpolator';
import Section from 'virtualdom/items/Section/_Section';
import Triple from 'virtualdom/items/Triple/_Triple';
import Element from 'virtualdom/items/Element/_Element';
import Partial from 'virtualdom/items/Partial/_Partial';
import getComponent from 'virtualdom/items/Component/getComponent';
import Component from 'virtualdom/items/Component/_Component';
import Comment from 'virtualdom/items/Comment';
import Yielder from 'virtualdom/items/Yielder';
import Doctype from 'virtualdom/items/Doctype';

export default function createItem ( options ) {
	if ( typeof options.template === 'string' ) {
		return new Text( options );
	}

	switch ( options.template.t ) {
		case INTERPOLATOR:
			if ( options.template.r === 'yield' ) {
				return new Yielder( options );
			}
			return new Interpolator( options );
		case SECTION:      return new Section( options );
		case TRIPLE:       return new Triple( options );
		case ELEMENT:
			let constructor;
			if ( constructor = getComponent( options.parentFragment.root, options.template.e ) ) {
				return new Component( options, constructor );
			}
			return new Element( options );
		case PARTIAL:      return new Partial( options );
		case COMMENT:      return new Comment( options );
		case DOCTYPE:      return new Doctype( options );

		default: throw new Error( 'Something very strange happened. Please file an issue at https://github.com/ractivejs/ractive/issues. Thanks!' );
	}
}
