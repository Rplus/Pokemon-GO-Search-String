<script>
  import Textaea from './Textaea.svelte';

  import Urls from './Urls.svelte';
  import Style from './Style.svelte';

  import { historeUrls } from './stores.js';

  import * as u from './u.js';

  let { langs, names, pms } = u.jsonData;

  let data = { ...u.urlCoCoCo(location.hash) };

  $: data.pm = getPM(data.uid);
  $: data.pmName = getTitle(data.uid);
  $: data.cphp = langs.find(l => l[0] === data.lang).slice(1, 3);
  $: data.searchString = u.searchString(data);
  $: location.hash = u.urlGoGoGo(data);

  $: datalist = pms.map(pm => {
    return u.genOptions(pm.uid, getTitle(pm.uid, data.lang));
  }).join('');

  function save() {
    historeUrls.add(u.urlGoGoGo(data));
  }

  function applyUrl(apply) {
    data = { ...u.urlCoCoCo(apply.detail.url) };
  }

  function getPM(uid) {
    return pms.find(_pm => _pm.uid === uid);
  }

  function getPmName(ddex, lang = data.lang) {
    return u.getPmName(ddex, lang);
  }

  function getTitle(uid) {
    let pm = getPM(uid);
    if (!pm) { return ''; }

    let n = getPmName(pm.ddex, data.lang);
    if (pm.isotope) {
      n = `${n} (${pm.isotope})`;
    }
    return n;
  };

</script>

<style>
.workspace {
  display: flex;
  flex-direction: column;
  min-height: 95vh;
}
</style>


<Style />


<div class="workspace">
  <h1>Pokémon Go Search String Generateor</h1>

  <div class="label">
    Pokémon:
    <div class="ib">
      #<input
        type="text"
        name="pmuid"
        required
        list="pokemon"
        bind:value={ data.uid }
      >
      <span class="ib">{ data.pmName }</span>
    </div>

    <datalist id="pokemon">
      {@html datalist }
    </datalist>
  </div>

  <div class="label">
    <label>
      Minimum %:
      <select bind:value={ data.min_iv }>
        {#each u.options.ivp as i}
          <option value={i[0]}>{i[1]}</option>
        {/each}
      </select>
    </label>
  </div>

  <div class="label">
    Min IVs (A/D/S):
    <select bind:value={ data.min_iv_a }>
      {#each u.options.iv as i}
        <option value={i}>{i}</option>
      {/each}
    </select>

    <select bind:value={ data.min_iv_d }>
      {#each u.options.iv as i}
        <option value={i}>{i}</option>
      {/each}
    </select>

    <select bind:value={ data.min_iv_s }>
      {#each u.options.iv as i}
        <option value={i}>{i}</option>
      {/each}
    </select>
  </div>

  <div class="label">
    Level:
    <select bind:value={ data.min_lv }>
      {#each u.options.lv as i}
        <option value={i[0]}>{i[1]}</option>
      {/each}
    </select>
    -
    <select bind:value={ data.max_lv }>
      {#each u.options.lv as i}
        <option value={i[0]}>{i[1]}</option>
      {/each}
    </select>
  </div>

  <div class="label">
    <label>
      Language:
      <select bind:value={ data.lang }>
        {#each langs as i}
          <option value={i[0]}>{i[3]}</option>
        {/each}
      </select>
    </label>
  </div>

  <div class="label">
    <label>
      Trash String:
      <input type="checkbox" bind:checked={ data.trash }>
    </label>
  </div>

  <hr>

  <Textaea value={ data.searchString }>
    <button class="btn" on:click|preventDefault={ save }>Save</button>
  </Textaea>

  <hr>

  <Urls on:apply={ applyUrl } />

  <footer>
    formula source from <a href="http://ark42.com/pogo/search.php">http://ark42.com/pogo/search.php</a>
  </footer>
</div>
