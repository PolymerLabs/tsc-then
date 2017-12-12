# tsc-then

`tsc -w` will watch the filesystem and recompile your code almost instantly. Wouldn't you like to be able to run a command after it's done compiling? Like run your tests?

`tsc-then` is a super simple command that will run `tsc -w` and run a specified command after `tsc -w` is finished. It's ok if your command takes much longer than compiling, it will wait until the last run of your command is finished before starting the next one.

Because I'm generally editing with a smart editor that gives me inline errors, I left typescript's error reporting out of the console output, but this may change or become an option in a future version.

# Example Usage

    tsc-then -- npx mocha

This runs typescript's `tsc -w`, and each time compilation finishes, it runs the command `npx mocha`. It passes the stdout and stderr of `npx mocha` through, as well as some lines to delineate one run of the command from the next.
