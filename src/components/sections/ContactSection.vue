<template>
  <section
    :class="sectionRootClass"
    data-reading-zone="contact"
  >
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
            class="contact-card reading-border group"
          >
            <span
              class="contact-card-icon-well"
              aria-hidden="true"
            >
              <span class="reading-icon opacity-90">
                <AppIcon
                  name="icon-[heroicons-outline--phone]"
                  :size="1.25"
                />
              </span>
            </span>
            <div class="contact-card-copy">
              <span
                class="contact-card-kicker reading-subtle"
                v-reading-chars="'Phone'"
              />
              <span
                class="contact-card-value reading-link"
                v-reading-chars="phone"
              />
            </div>
          </a>
          <a
            :href="gmailComposeHref"
            class="contact-card reading-border group"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="`Open Gmail to email ${email}`"
          >
            <span
              class="contact-card-icon-well"
              aria-hidden="true"
            >
              <span class="reading-icon opacity-90">
                <AppIcon
                  name="icon-[heroicons-outline--envelope]"
                  :size="1.25"
                />
              </span>
            </span>
            <div class="contact-card-copy">
              <span
                class="contact-card-kicker reading-subtle"
                v-reading-chars="'Email'"
              />
              <span
                class="contact-card-value reading-link break-all"
                v-reading-chars="email"
              />
            </div>
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
            class="contact-links-grid"
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
                class="contact-link-card reading-border reading-link group"
              >
                <span
                  class="contact-card-icon-well contact-link-card-icon"
                  aria-hidden="true"
                >
                  <span class="reading-icon opacity-95">
                    <AppIcon
                      :name="iconForContactLink(link.url)"
                      :size="1.2"
                    />
                  </span>
                </span>
                <span
                  class="contact-link-label font-medium"
                  v-reading-chars="link.label"
                />
                <span
                  class="contact-link-external reading-icon inline-flex shrink-0 opacity-55 transition-opacity group-hover:opacity-100"
                  aria-hidden="true"
                >
                  <AppIcon
                    name="icon-[heroicons-outline--arrow-top-right-on-square]"
                    :size="1"
                  />
                </span>
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
import AppIcon from '@/components/global/AppIcon.vue';

/**
 * Full `icon-[set--name]` strings so Tailwind’s @iconify/tailwind4 plugin
 * can see them at build time (classes built only inside AppIcon won’t scan).
 */
function iconForContactLink(url: string): string {
  const u = url.toLowerCase();
  if (u.includes('linkedin.com')) return 'icon-[simple-icons--linkedin]';
  if (u.includes('github.com')) return 'icon-[simple-icons--github]';
  if (u.includes('vercel.app') || u.includes('vercel.com')) return 'icon-[simple-icons--vercel]';
  return 'icon-[heroicons-outline--globe-alt]';
}

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

/** Gmail web compose — recipient + subject pre-filled (opens in new tab). */
const gmailComposeHref = computed(() => {
  const to = props.email.trim();
  if (!to) return 'https://mail.google.com/mail/';
  const su = encodeURIComponent('Hello - portfolio contact');
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${su}`;
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
  min-height: 3.75rem;
  flex-direction: row;
  align-items: center;
  gap: clamp(0.85rem, 2.5vw, 1.1rem);
  border-radius: 1rem;
  border-width: 1px;
  border-style: solid;
  padding: clamp(1rem, 3vw, 1.2rem) clamp(1rem, 3vw, 1.25rem);
  text-decoration: none;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
  background: color-mix(in srgb, var(--section-chip-bg,f8f8f8) 35%, transparent);
}

.contact-card-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 0.35rem;
}

.contact-card-icon-well {
  display: flex;
  flex-shrink: 0;
  width: 2.75rem;
  height: 2.75rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.8rem;
  transition: background-color 0.2s ease, transform 0.2s ease;
  background: color-mix(in srgb, var(--section-chip-bg, rgba(0, 0, 0, 0.06)) 58%, transparent);
}

@media (hover: hover) and (pointer: fine) {
  .contact-card:hover .contact-card-icon-well {
    transform: scale(1.04);
    background: color-mix(in srgb, var(--section-chip-bg, rgba(0, 0, 0, 0.06)) 72%, transparent);
  }
}

@media (hover: hover) and (pointer: fine) {
  .contact-card:hover {
    transform: translateY(-2px);
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.08),
      0 0 0 1px var(--reading-border-sync, var(--section-divider));
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

.contact-links-grid {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.65rem;
}

@media (min-width: 640px) {
  .contact-links-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }
}

.contact-link-card {
  display: flex;
  min-height: 3.5rem;
  align-items: center;
  gap: 0.85rem;
  border-radius: 1rem;
  border-width: 1px;
  border-style: solid;
  padding: 0.85rem 1rem;
  text-decoration: none;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
  background: color-mix(in srgb, var(--section-chip-bg, rgba(0, 0, 0, 0.06)) 35%, transparent);
}

.contact-link-card-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
}

@media (hover: hover) and (pointer: fine) {
  .contact-link-card:hover {
    transform: translateY(-2px);
    box-shadow:
      0 10px 28px rgba(0, 0, 0, 0.07),
      0 0 0 1px var(--reading-border-sync, var(--section-divider));
  }

  .contact-link-card:hover .contact-link-card-icon {
    transform: scale(1.05);
    background: color-mix(in srgb, var(--section-chip-bg, rgba(0, 0, 0, 0.06)) 72%, transparent);
  }
}

.contact-link-card:focus-visible {
  outline: 2px solid var(--section-link, #3b82f6);
  outline-offset: 2px;
}

.contact-link-label {
  min-width: 0;
  flex: 1 1 auto;
  font-size: 0.9375rem;
}

@media (min-width: 640px) {
  .contact-link-label {
    font-size: 1rem;
  }
}

.contact-link-external {
  margin-left: auto;
}

@media (prefers-reduced-motion: reduce) {
  .contact-card,
  .contact-link-card {
    transition: none;
  }

  @media (hover: hover) and (pointer: fine) {
    .contact-card:hover,
    .contact-link-card:hover,
    .contact-card:hover .contact-card-icon-well,
    .contact-link-card:hover .contact-link-card-icon {
      transform: none;
    }
  }
}
</style>
