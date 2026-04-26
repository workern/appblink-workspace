import { Directive } from '@angular/core';
import { classes } from '@spartan/components/utils';

@Directive({
	selector: 'kbd[hlmKbdGroup]',
	host: {
		'data-slot': 'kbd-group',
	},
})
export class HlmKbdGroup {
	constructor() {
		classes(() => 'inline-flex items-center gap-1');
	}
}
