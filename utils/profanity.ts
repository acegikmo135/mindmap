/**
 * profanity.ts
 * School-safe input filter for a Class 6-10 platform.
 * Covers common English profanity, Hindi/Hinglish, and Gujarati transliterations.
 * Used in Profile fields and Auth signup — keeps the platform clean.
 */

// Each entry is a regex pattern (case-insensitive, whole-word or substring match).
const BLOCKED: RegExp[] = [
  // ── English ──────────────────────────────────────────────────────────────────
  /\bf+u+c+k+[a-z]*/i,
  /\bf[@*]ck/i,
  /\bsh[i1]t+[a-z]*/i,
  /\bb[i1]tch/i,
  /\ba[s$][s$]+h[o0]le/i,
  /\bcunt/i,
  /\bd[i1]ck[a-z]*/i,
  /\bcock[a-z]*/i,
  /\bpussy/i,
  /\bass+h[o0]le/i,
  /\bwhore/i,
  /\bslut/i,
  /\bbastard/i,
  /\bwank[a-z]*/i,
  /\bprick/i,
  /\btwat/i,
  /\bporn/i,
  /\bsex+y*/i,
  /\bnigga/i,
  /\bn[i1]gg[ae]r/i,

  // ── Hindi / Hinglish transliterations ────────────────────────────────────────
  /chut[iy]+a/i,
  /bhosdi/i,
  /madarch[o0]d/i,
  /behen\s*ch[o0]d/i,
  /\bbc\b/i,
  /maarc/i,
  /rand[i1]/i,
  /l[au]nd[aiu]*/i,
  /ga[a4]nd/i,
  /haraam[iz]/i,
  /kamina/i,
  /saala/i,
  /bakwas/i,
  /\bmc\b/i,

  // ── Gujarati / Gujarati-English transliterations ──────────────────────────────
  // Slang for female genitalia
  /bh[ou]s\s*d[iyu]/i,
  /fud[iyu]/i,
  /fu[dt][iyu]/i,
  // Slang for male genitalia
  /l[ou]nd[aiu]*/i,
  /\bland[aiu]/i,
  // Motherly/sisterly abuses
  /bhench[o0]d/i,
  /b[eo]n\s*ch[o0]d/i,
  /mach[o0]d/i,
  /ma\s*ch[o0]d/i,
  /teri\s*ma/i,
  // General insults common in Gujarati slang
  /chh[oi]nar[oa]*/i,   // loose character insult
  /ch[ou]d[aiu]/i,
  /ghel[ou]/i,           // idiot (mild, but used abusively)
  /dhed/i,               // caste-based slur — blocked
  /bhang[iyu]/i,         // caste-based slur — blocked
  /chakk[ao]/i,          // slur for transgender persons
  /hija[dr][ao]*/i,      // slur
  /rakh[ae]l/i,          // kept woman, used as insult
  /vesh[yj]a/i,          // sex worker used as insult
  /gaand[uio]*/i,
  /g[a4]nd[uio]*/i,
  /ch[ou]tiy[ao]/i,
  /ch[ou]tiyo/i,
  /bh[ao]sd[iyu]/i,
  /m[au]tr[ao]/i,        // Gujarati variant abuse
  /teri\s*bhen/i,
];

/**
 * Returns true if the input contains blocked content.
 * Used to block saving the value and show an error.
 */
export function containsProfanity(text: string): boolean {
  const t = text.toLowerCase();
  return BLOCKED.some(re => re.test(t));
}

/**
 * Returns a user-friendly error message if profanity is detected, else null.
 */
export function getProfanityError(text: string): string | null {
  return containsProfanity(text)
    ? 'Please use appropriate language. This is a school platform.'
    : null;
}
