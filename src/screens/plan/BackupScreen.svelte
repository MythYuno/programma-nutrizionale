<script lang="ts">
  import CaretLeft from 'phosphor-svelte/lib/CaretLeft';
  import DownloadSimple from 'phosphor-svelte/lib/DownloadSimple';
  import UploadSimple from 'phosphor-svelte/lib/UploadSimple';
  import { db } from '../../db/schema';
  import { backupFileName, exportBackup, parseBackup, restoreBackup, type Backup, type BackupSummary } from '../../db/backup';
  import { convertLegacyPlan } from '../../domain/legacy';
  import { LEGACY_DEFAULT_PLAN } from '../../domain/legacy-default';
  import { mondayOf } from '../../domain/schedule';
  import { app } from '../../state/app.svelte';
  import { editor } from '../../state/editor.svelte';
  import { router } from '../../state/router.svelte';
  import Sheet from '../../ui/Sheet.svelte';

  let fileInput: HTMLInputElement;
  let pending = $state<{ backup: Backup; summary: BackupSummary } | null>(null);
  let confirmOpen = $state(false);
  let resetOpen = $state(false);
  let message = $state('');
  let error = $state('');

  function download(data: unknown, name: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function doExport() {
    download(await exportBackup(db), backupFileName());
    await app.updateSettings({ lastBackupAt: new Date().toISOString() });
    message = 'Backup esportato.';
  }

  async function onFile(e: Event) {
    error = '';
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    const res = parseBackup(await file.text());
    fileInput.value = '';
    if ('error' in res) { error = res.error; return; }
    pending = res;
    confirmOpen = true;
  }

  async function doImport() {
    if (!pending) return;
    // Prima di sovrascrivere si scarica una copia di quello che c'è ora.
    download(await exportBackup(db), 'prima-di-importare-' + backupFileName());
    await restoreBackup(db, pending.backup);
    pending = null;
    confirmOpen = false;
    editor.draft = null;
    await app.reload();
    message = 'Backup importato.';
  }

  async function resetSample() {
    const { plan, newFoods } = convertLegacyPlan(LEGACY_DEFAULT_PLAN, 'piano-esempio-' + Date.now(), mondayOf(app.today));
    for (const f of newFoods) await app.saveFood(f);
    await app.savePlan(plan);
    editor.reset();
    resetOpen = false;
    message = 'Piano di esempio ripristinato.';
  }

  const fmtDate = (iso: string) => new Date(iso).toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' });
</script>

<main class="screen">
  <button class="back link" onclick={() => router.back('piano')}><CaretLeft size={20} /> Piano</button>
  <h1 class="large-title">Backup</h1>

  {#if message}<div class="card ok">{message}</div>{/if}
  {#if error}<div class="notice">{error}</div>{/if}

  <div class="group">
    <button class="row" onclick={doExport}><DownloadSimple size={22} color="var(--blue)" /><span class="grow">Esporta backup</span></button>
    <button class="row" onclick={() => fileInput.click()}><UploadSimple size={22} color="var(--blue)" /><span class="grow">Importa backup…</span></button>
  </div>
  <input bind:this={fileInput} type="file" accept="application/json,.json" hidden onchange={onFile} />
  <p class="section-foot">
    I dati restano solo su questo telefono. Esporta un backup ogni tanto e salvalo in File o iCloud.
    {#if app.settings.lastBackupAt}Ultimo backup: {fmtDate(app.settings.lastBackupAt)}.{:else}Non hai ancora fatto un backup.{/if}
  </p>

  <h2 class="section-title">Archiviazione</h2>
  <div class="group">
    <div class="row"><span class="grow">Archiviazione persistente</span><span class="value">{app.persisted ? 'Attiva' : 'Non concessa'}</span></div>
  </div>
  <p class="section-foot">
    {#if app.persisted}Il sistema non cancellerà i dati per liberare spazio.{:else}Il sistema potrebbe cancellare i dati se manca spazio o se non usi l'app per settimane: aggiungila alla schermata Home e tieni un backup.{/if}
  </p>

  <h2 class="section-title">Piano</h2>
  <div class="group">
    <button class="row danger" onclick={() => (resetOpen = true)}>Ripristina il piano di esempio</button>
  </div>
  <p class="section-foot">Crea un nuovo piano dal piano originale del Dott. Occhino e lo rende attivo. Pesate e pasti fatti restano.</p>
</main>

<Sheet bind:open={confirmOpen} title="Importare questo backup?">
  {#if pending}
    <div class="group">
      <div class="row"><span class="grow">Creato il</span><span class="value">{fmtDate(pending.summary.exportedAt)}</span></div>
      <div class="row"><span class="grow">Piani</span><span class="value">{pending.summary.plans}</span></div>
      <div class="row"><span class="grow">Alimenti</span><span class="value">{pending.summary.foods}</span></div>
      <div class="row"><span class="grow">Pasti fatti</span><span class="value">{pending.summary.mealLogs}</span></div>
      <div class="row"><span class="grow">Pesate</span><span class="value">{pending.summary.weights}</span></div>
    </div>
    <p class="section-foot">Tutti i dati attuali vengono sostituiti. Prima scarico in automatico una copia di quelli di adesso.</p>
    <button class="btn" onclick={doImport}>Sostituisci i dati</button>
  {/if}
</Sheet>

<Sheet bind:open={resetOpen} title="Ripristinare il piano di esempio?">
  <p>Il piano attivo diventa quello originale. Le modifiche non salvate nell'editor vanno perse.</p>
  <button class="btn" onclick={resetSample}>Ripristina</button>
</Sheet>

<style>
  .back { display: flex; align-items: center; gap: 2px; margin-left: -6px; padding: 4px 0 6px; }
  .ok { color: var(--green); font-weight: 600; }
  .danger { color: var(--red); }
</style>
