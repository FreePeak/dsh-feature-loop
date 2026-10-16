# VERIFY — the plugin injects unscoped CSS into the host DSH web UI

Claim under test: installing this plugin changes the styling of a DSH web UI it
does not own. Measured on two real instances on this machine, not asserted.

`test/capture-css-injection-evidence.mjs` takes two already-running URLs — a
control with the plugin **not** installed, and the instance under test — and
reports the difference. Provisioning lives in the shell, not the script: a
capture script that also boots servers produces failures that are hard to read.

The control is what makes the claim checkable. The host app uses Tailwind too,
so both stylesheets contain `--tw-*` variables and no single marker separates
them; only a difference between two real instances attributes the rules.

## The numbers

| | Control (no plugin) | Plugin instance | Delta |
|---|---|---|---|
| Stylesheets | 138 | 139 | **+1** |
| CSS rules | 3,710 | 4,470 | **+760** |
| CSS bytes | 381,207 | 530,129 | **+148,922** |

![control](evidence/css-injection-control.png)
![plugin](evidence/css-injection-plugin.png)

## The observable leak

Both screenshots are the same page in the same state, and differ in one thing:

| | Host modal heading |
|---|---|
| Control | `Internal Testing Notice` |
| Plugin | `INTERNAL TESTING NOTICE` |

Read from computed style, not eyeballed:

```
CONTROL  "Internal Testing Notice" -> text-transform: none
PLUGIN   "Internal Testing Notice" -> text-transform: uppercase
```

The heading belongs to the DSH web app. The plugin changes how it renders, so
its stylesheet reaches elements it does not own.

## Why it happens

`client.js` is 442 kB with Tailwind compiled inline, alongside
`assets/assistant-ui/dashboard.css` (106 kB) and `shell.css` (30 kB). The
client runtime calls `createElement("style")` and injects them **unscoped** into
the host document. ~145 kB of Tailwind utilities and reset then compete with the
shell's own styles in one stylesheet set. The specific `text-transform` on the
heading is the symptom that happens to be visible in this state; it is not the
only collision, and this evidence does not enumerate them.

## The practical consequence

A host profile with `patchReload: live` applies these patches to an already
running session. The operator's running DSH UI can therefore change styling
because a plugin was installed underneath it, with no reload and no prompt.
That is what this documents; it is not hypothetical.

## What this does not prove

- Two instances, one machine, one browser. Not a visual regression suite.
- It counts rules and bytes and reads one element's computed style. It does not
  enumerate which selectors collide, and does not prove the full set of host
  elements affected.
- A page that renders acceptably is not an unaffected page. The same unscoped
  injection can break a host that ships different styles.
- Nothing here is fixed by this commit. The fix is to scope the injected CSS to
  the plugin's own subtree.

## Reproduce

```bash
# control: a web profile without the plugin
dsh --profile flcssctl --from-default-profile web --no-open
# under test: this plugin registered as a bundle
dsh --profile flsandbox --port 3188 --no-open

bash ~/.dsh/profiles/flsandbox/url.sh          # current token
node --experimental-strip-types test/capture-css-injection-evidence.mjs \
  "<control-url>" "<plugin-url>"
```
