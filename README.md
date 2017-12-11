# Usage

    tsc-then npx mocha

This runs typescript's `tsc -w`, and each time compilation finishes, it runs the command `npx mocha`. It passes the stdout and stderr of `npx mocha` through, as well as some lines to delineate one run of the command from the next.
