<script>
  export let value;

  let textareaElm;
  function copy() {
    textareaElm.select();
    document.execCommand('copy');
  };
</script>

<div class="btn-grounp">
  <button class="btn" on:click|preventDefault={ copy }>Click to Copy!</button>
  <slot></slot>
</div>

<textarea bind:value={ value } bind:this={ textareaElm } ></textarea>

