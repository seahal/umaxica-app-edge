declare module 'react-aria-components' {
	import type { ComponentType, ReactNode } from 'react';

	export interface ButtonProps {
		children?: ReactNode;
		onPress?: () => void;
		[key: string]: unknown;
	}

	export const Button: ComponentType<ButtonProps>;
}
