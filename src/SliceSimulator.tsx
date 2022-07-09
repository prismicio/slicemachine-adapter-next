import * as React from "react";
import {
	CoreManager,
	SliceSimulatorProps as BaseSliceSimulatorProps,
	SliceSimulatorState,
	StateManagerEventType,
	StateManagerStatus,
	disableEventHandler,
	getDefaultManagedState,
	getDefaultMessage,
	getDefaultProps,
	getDefaultSlices,
	onClickHandler,
	simulatorClass,
	simulatorRootClass,
} from "@prismicio/slice-simulator-core";

const coreManager = new CoreManager();

export type SliceSimulatorSliceZoneProps = {
	slices: SliceSimulatorState["slices"];
};

export type SliceSimulatorProps = {
	/**
	 * React component to render simulated Slices.
	 *
	 * @example
	 *
	 * ```tsx
	 * import { SliceSimulator } from "@slicemachine/adapter-next";
	 * import { SliceZone } from "@prismicio/react";
	 *
	 * import { components } from "../slices";
	 * import state from "../.slicemachine/libraries-state.json";
	 *
	 * <SliceSimulator
	 * 	sliceZone={({ slices }) => (
	 * 		<SliceZone slices={slices} components={components} />
	 * 	)}
	 * 	state={state}
	 * />;
	 * ```
	 */
	sliceZone: (props: SliceSimulatorSliceZoneProps) => JSX.Element;
	className?: string;
} & BaseSliceSimulatorProps;

export const SliceSimulator = ({
	sliceZone: SliceZoneComp,
	state,
	background,
	zIndex,
	className,
}: SliceSimulatorProps): JSX.Element => {
	const defaultProps = getDefaultProps();

	const [managedState, setManagedState] = React.useState(() =>
		getDefaultManagedState(),
	);
	const [slices, setSlices] = React.useState(() => getDefaultSlices());
	const [message, setMessage] = React.useState(() => getDefaultMessage());

	React.useEffect(() => {
		coreManager.stateManager.on(
			StateManagerEventType.ManagedState,
			(_managedState) => {
				setManagedState(_managedState);
			},
			"simulator-managed-state",
		);
		coreManager.stateManager.on(
			StateManagerEventType.Slices,
			(_slices) => {
				setSlices(_slices);
			},
			"simulator-slices",
		);
		coreManager.stateManager.on(
			StateManagerEventType.Message,
			(_message) => {
				setMessage(_message);
			},
			"simulator-message",
		);

		coreManager.init(state);

		return () => {
			coreManager.stateManager.off(
				StateManagerEventType.ManagedState,
				"simulator-managed-state",
			);

			coreManager.stateManager.off(
				StateManagerEventType.Slices,
				"simulator-slices",
			);

			coreManager.stateManager.off(
				StateManagerEventType.Message,
				"simulator-message",
			);
		};
	}, []);

	// Update state on HMR
	const didMount = React.useRef(false);
	React.useEffect(() => {
		if (didMount.current) {
			coreManager.stateManager.reload(state);
		} else {
			didMount.current = true;
		}
	}, [state]);

	return (
		<div
			className={[simulatorClass, className].filter(Boolean).join(" ")}
			style={{
				zIndex:
					typeof zIndex === "undefined"
						? defaultProps.zIndex
						: zIndex ?? undefined,
				position: "fixed",
				top: 0,
				left: 0,
				width: "100%",
				height: "100vh",
				overflow: "auto",
				background:
					typeof background === "undefined"
						? defaultProps.background
						: background ?? undefined,
			}}
		>
			{message ? (
				<article dangerouslySetInnerHTML={{ __html: message }} />
			) : slices.length ? (
				<div
					id="root"
					className={simulatorRootClass}
					style={
						managedState.status !== StateManagerStatus.Loaded
							? { display: "none" }
							: undefined
					}
					onClickCapture={onClickHandler as unknown as React.MouseEventHandler}
					onSubmitCapture={
						disableEventHandler as unknown as React.FormEventHandler
					}
				>
					<SliceZoneComp slices={slices} />
				</div>
			) : null}
		</div>
	);
};
