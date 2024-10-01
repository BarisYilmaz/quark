# Quark

Quark is a lightweight TypeScript library for generating and extracting unique, time-based identifiers similar to Twitter's Snowflake IDs. It provides a simple and efficient way to create distributed, sortable unique identifiers for your applications.

## Features

-   Generate unique 64-bit identifiers
-   Customizable epoch
-   Machine ID support for distributed systems
-   Efficient bitwise operations using BigInt
-   Extract timestamp, machine ID, and sequence from generated IDs
-   Customizable bit allocation for machine ID and sequence
-   Flexible constructor options

## Installation

## NPM

```bash
npm install quark
pnpm install quark
yarn add quark
```

## JSR

```bash
deno add jsr:@hadron/quark
npx jsr add @hadron/quark
pnpm dlx jsr add @hadron/quark
yarn dlx jsr add @hadron/quark
bunx jsr add @hadron/quark
```

## Usage

### Basic Usage

```typescript
import { Quark } from "quark";

// Create a new Quark instance with machine ID 1
const quark = new Quark(1);

// Generate a new ID
const id = quark.generate();
console.log(id); // 123456789012345678n

// Extract information from the ID
const info = quark.extract(id);
console.log(info);
// Output: { timestamp: 1621234567890, machineId: 1, sequence: 0 }
```

### Custom Epoch and Bit Allocation

You can set a custom epoch (in milliseconds) and customize bit allocation:

```typescript
const customEpoch = 1704067200000; // January 1, 2024
const quark = new Quark({
	machineId: 1,
	epoch: customEpoch,
	customAllocation: {
		machineId: 8,
		sequence: 14,
	},
});
```

## How It Works

Quark generates 64-bit IDs with the following default structure:

-   42 bits: Timestamp (milliseconds since epoch)
-   10 bits: Machine ID
-   12 bits: Sequence number

This structure is customizable but the total bits for machine ID and sequence must not exceed 22 bits.

## API Reference

### Constructor

The Quark class has a flexible constructor that accepts either individual parameters or an options object:

```typescript
constructor(machineId: number, epoch?: number, options?: Omit<QuarkOptions, "machineId" | "epoch">);
constructor(options: QuarkOptions);
```

#### QuarkOptions

-   `machineId`: A number representing the machine or process.
-   `epoch`: (Optional) Custom epoch in milliseconds. Defaults to 0 (Unix epoch).
-   `customAllocation`: (Optional) Custom bit allocation for machine ID and sequence.
-   `throwError`: (Optional) Whether to throw errors on invalid configurations.

### Methods

#### `generate(): bigint`

Generates a new unique ID.

#### `extract(quark: bigint): { timestamp: number; machineId: number; sequence: number }`

Extracts full information from a generated ID.

#### `extractTimestamp(quark: bigint): number`

Extracts the timestamp from a generated ID.

#### `extractDate(quark: bigint): Date`

Extracts the date from a generated ID.

#### `extractMachineId(quark: bigint): number`

Extracts the machine ID from a generated ID.

#### `extractSequence(quark: bigint): number`

Extracts the sequence number from a generated ID.

## Contributing

We welcome contributions to this project! If you would like to contribute, please follow these guidelines:

1. **Fork this repository:** Create a personal fork of the repository on GitHub.
2. **Clone the fork:** Clone the fork to your local machine and add the upstream repository as a remote.
    ```bash
    git clone https://github.com/BarisYilmaz/quark.git
    ```
3. Create a branch: Create a new branch for your changes.
    ```bash
    git checkout -b feature/your-feature-name
    ```
4. Make your changes: Implement your changes in the new branch.
5. Commit your changes: Commit your changes with a descriptive commit message.
    ```bash
    git commit -m "Description of your changes"
    ```
6. Push to your fork: Push your changes to your forked repository.
    ```bash
    git push origin feature/your-feature-name
    ```
7. Create a Pull Request: Open a pull request from your branch to the main repository's main branch. Provide a clear description of your changes and any relevant information.

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/BarisYilmaz/quark/blob/master/LICENSE) file for details.
