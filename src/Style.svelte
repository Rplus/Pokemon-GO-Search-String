<style>
:global(html, body) {
  position: relative;
  width: 100%;
  height: 100%;
}

:global(body) {
  color: #333;
  margin: 0;
  padding: 8px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
}

:global(a) {
  color: rgb(0,100,200);
  text-decoration: none;
}

:global(a:hover) {
  text-decoration: underline;
}

:global(a:visited) {
  color: rgb(0, 80, 160);
}

:global(input, button, select, textarea) {
  font-family: inherit;
  font-size: inherit;
  padding: .2em .4em;
  margin: 0 0 .5em 0;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 2px;
}

:global(input:disabled) {
  color: #ccc;
}

:global(input[type="range"]) {
  height: 0;
}

:global(button) {
  background-color: #f4f4f4;
  outline: none;
}

:global(button:active) {
  background-color: #ddd;
}

:global(button:focus) {
  border-color: #666;
}

:global(hr) {
  width: 100%;
  margin: 1rem 0;
  border: 1px dashed #eee;
}

:global(*) {
  box-sizing: border-box;
}

:global(input) {
  max-width: 9em;
}

:global(textarea) {
  width: 100%;
  height: 50%;
  max-width: 100%;
  min-height: 8em;
  padding: .6em .8em;
  box-shadow: inset 1px 1px 5px rgba(0, 0, 0, .3);
}

:global(footer) {
  margin-top: auto; 
  text-align: right;
}

:global(.btn-grounp) {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
}

:global(.btn) {
  padding: .5em 1em;
}

:global(.ib) {
  display: inline-block;
}
</style>
