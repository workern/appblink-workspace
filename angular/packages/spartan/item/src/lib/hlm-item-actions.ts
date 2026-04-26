import { Directive } from '@angular/core';
import { classes } from '@spartan/components/utils';

@Directive({
	selector: '[hlmItemActions],hlm-item-actions',
	host: {
		'data-slot': 'item-actions',
	},
})
export class HlmItemActions {
	constructor() {
		classes(() => 'flex items-center gap-2');
	}
}
