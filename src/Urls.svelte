<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  import { historeUrls, savedUrl } from './stores.js';

  function applyUrl(p) {
    dispatch('apply', {
      url: p,
    });
  }
</script>

<style>
  .li {
    display: flex;
    align-items: center;
    margin-top: .5em;
    margin-bottom: .5em;
  }

  .btn {
    margin: 0 .5em;
  }
</style>

<details open>
  <summary>
    Saved items:
  </summary>

  {#each $savedUrl as url (url)}
    <div class="li">
      <button class="btn"
        on:click|preventDefault="{() => historeUrls.remove(url) }"
      >⨯</button>

      <a href={ '#' + url }
        on:click|preventDefault="{() => applyUrl(url) }"
      >{ url.split('&').join(', ') }</a>
    </div>
  {/each}
</details>

