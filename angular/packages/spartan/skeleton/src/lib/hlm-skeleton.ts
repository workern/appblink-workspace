import { Directive } from '@angular/core';
import { classes } from '@spartan/components/utils';

@Directive({
	selector: '[hlmSkeleton],hlm-skeleton',
	host: {
		'data-slot': 'skeleton',
	},
})
export class HlmSkeleton {
	constructor() {
		classes(() => 'bg-muted rounded-md block motion-safe:animate-pulse');
	}
}
