import { Directive } from '@angular/core';
import { classes } from '@spartan/components/utils';

export const hlmLarge = 'text-lg font-semibold';

@Directive({
	selector: '[hlmLarge]',
})
export class HlmLarge {
	constructor() {
		classes(() => hlmLarge);
	}
}
