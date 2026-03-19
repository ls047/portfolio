<template>
  <section :class="sectionRootClass">
    <div :class="sectionContentClass">
      <header class="contact-header">
        <h2
          class="reading-head text-balance text-xl font-bold sm:text-2xl md:text-3xl"
          v-reading-chars="'Contact'"
        />
        <p
          class="reading-muted mt-3 max-w-lg text-pretty text-sm leading-relaxed sm:mt-4 sm:text-base"
          v-reading-chars="CONTACT_BLURB"
        />
      </header>

      <div class="contact-blocks">
        <!-- Phone + email -->
        <div class="contact-primary-grid">
          <a
            :href="`tel:${normalizedPhone}`"
            class="contact-card reading-border"
          >
            <span
              class="contact-card-kicker reading-subtle"
              v-reading-chars="'Phone'"
            />
            <span
              class="contact-card-value reading-link"
              v-reading-chars="phone"
            />
          </a>
          <a
            :href="mailtoHref"
            class="contact-card reading-border"
            :aria-label="`Send email to ${email}`"
          >
            <span
              class="contact-card-kicker reading-subtle"
              v-reading-chars="'Email'"
            />
            <span
              class="contact-card-value reading-link break-all"
              v-reading-chars="email"
            />
          </a>
        </div>

        <!-- Languages -->
        <div
          v-if="languages?.length"
          class="contact-block"
        >
          <h3
            class="contact-block-title reading-subtle"
            v-reading-chars="'Languages'"
          />
          <ul
            class="contact-lang-list"
            role="list"
          >
            <li
              v-for="(lang, idx) in languages"
              :key="idx"
              class="contact-lang-item reading-chip"
            >
              <span
                class="contact-lang-name reading-body font-medium"
                v-reading-chars="lang.name"
              />
              <span
                class="contact-lang-level reading-muted text-sm"
                v-reading-chars="lang.level"
              />
            </li>
          </ul>
        </div>

        <!-- Social / links -->
        <div
          v-if="links?.length"
          class="contact-block"
        >
          <h3
            class="contact-block-title reading-subtle"
            v-reading-chars="'Links'"
          />
          <ul
            class="contact-links-list"
            role="list"
          >
            <li
              v-for="(link, idx) in links"
              :key="idx"
            >
              <a
                :href="link.url"
                target="_blank"
                rel="noopener noreferrer"
                class="contact-link-row reading-border reading-link"
              >
                <span
                  class="contact-link-label font-medium"
                  v-reading-chars="link.label"
                />
                <span
                  class="contact-link-arrow reading-subtle"
                  aria-hidden="true"
                >↗</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { sectionContentClass, sectionRootClass } from '@/constants/sectionLayout';

const CONTACT_BLURB =
  'Open to projects, collaboration, and full-time roles — email works best for longer messages.';

const props = defineProps<{
  phone: string;
  email: string;
  languages: { name: string; level: string }[];
  links: { label: string; url: string }[];
}>();

/** Tel: URIs should avoid spaces for widest device support */
const normalizedPhone = computed(() => props.phone.replace(/[\s-]/g, ''));

/** Valid mailto: opens the user’s mail app (subject pre-filled). */
const mailtoHref = computed(() => {
  const to = props.email.trim();
  if (!to) return 'mailto:';
  const query = new URLSearchParams({
    subject: 'Hello - portfolio contact',
  });
  return `mailto:${to}?${query.toString()}`;
});
</script>

<style scoped>
.contact-header {
  margin-bottom: clamp(1.75rem, 5vw, 2.5rem);
}

.contact-blocks {
  display: flex;
  flex-direction: column;
  gap: clamp(2rem, 5vw, 2.75rem);
}

.contact-primary-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .contact-primary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }
}

.contact-card {
  display: flex;
  min-height: 3.25rem;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 0.35rem;
  border-radius: 1rem;
  border-width: 1px;
  border-style: solid;
  padding: clamp(1rem, 3vw, 1.25rem) clamp(1rem, 3vw, 1.35rem);
  text-decoration: none;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
  background: color-mix(in srgb, var(--section-chip-bg,f8f8f8) 35%, transparent);
}

@media (hover: hover) and (pointer: fine) {
  .contact-card:hover {
    transform: translateY(-2px);
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.08),
      0 0 0 1px color-mix(in srgb, var(--section-divider, #ccc) 55%, transparent);
  }
}

.contact-card:focus-visible {
  outline: 2px solid var(--section-link, #3b82f6);
  outline-offset: 3px;
}

.contact-card-kicker {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.contact-card-value {
  font-size: clamp(0.9375rem, 2.8vw, 1.0625rem);
  font-weight: 600;
  line-height: 1.35;
}

.contact-block-title {
  margin: 0 0 0.75rem;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.contact-lang-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.65rem;
}

.contact-lang-item {
  display: inline-flex;
  align-items: baseline;
  gap: 0.5rem;
  border-radius: 9999px;
  padding: 0.4rem 0.85rem 0.45rem;
  font-size: 0.8125rem;
}

@media (min-width: 640px) {
  .contact-lang-item {
    padding: 0.45rem 1rem 0.5rem;
    font-size: 0.875rem;
  }
}

.contact-lang-level {
  opacity: 0.88;
}

.contact-links-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.contact-link-row {
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-radius: 0.875rem;
  border-width: 1px;
  border-style: solid;
  padding: 0.65rem 1rem;
  text-decoration: none;
  transition:
    background-color 0.18s ease,
    transform 0.18s ease;
}

@media (hover: hover) and (pointer: fine) {
  .contact-link-row:hover {
    background: color-mix(in srgb, var(--section-chip-bg, rgba(0, 0, 0, 0.06)) 50%, transparent);
    transform: translateX(2px);
  }
}

.contact-link-row:focus-visible {
  outline: 2px solid var(--section-link, #3b82f6);
  outline-offset: 2px;
}

.contact-link-label {
  min-width: 0;
  font-size: 0.9375rem;
}

@media (min-width: 640px) {
  .contact-link-label {
    font-size: 1rem;
  }
}

.contact-link-arrow {
  flex-shrink: 0;
  font-size: 1.1rem;
  line-height: 1;
  opacity: 0.65;
}

@media (prefers-reduced-motion: reduce) {
  .contact-card,
  .contact-link-row {
    transition: none;
  }

  @media (hover: hover) and (pointer: fine) {
    .contact-card:hover,
    .contact-link-row:hover {
      transform: none;
    }
  }
}
</style>
