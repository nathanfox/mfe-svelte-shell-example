<script lang="ts">
  const year = new Date().getFullYear();
</script>

<footer class="shell-footer">
  <p>&copy; {year} Micro UI Example. Built with Svelte 5.</p>
</footer>

<style>
  .shell-footer {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem;
    height: 48px;
    background: var(--footer-bg, #1a1a2e);
    color: var(--footer-text, #6b7280);
    border-top: 1px solid var(--border-color, #2d2d44);
    font-size: 0.75rem;
  }

  .shell-footer p {
    margin: 0;
  }
</style>
