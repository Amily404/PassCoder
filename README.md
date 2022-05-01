# PassCoder
This is a very simple cli tool that let's you create "ruled" password.

## What is a ruled password?

Ruled password consist of using easily rememberable passwords and make them a little more complex with the use of rules.

## Example:

```json
[
    ["a","@b"],
    ["i","^£"],
    ["j","2D"],
    ["n","?!"]
]
```
```bash
$ npx passcoder

> jackiechan 
2D@bck^£echa?!
```

## What's the point?
This way, you only need to remember one sort of complicated table and very easy passwords!

# Disclaimer
I cannot guarantie 100% security.

I am not responsible if you leak your table (situated in `%appdata%/passcoder/table.json`) or passwords.
