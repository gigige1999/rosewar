/* Original vector ornaments. These are heraldic interface graphics, not AI illustrations. */
(function () {
  'use strict';

  const wine = 'var(--ornament-red, #722d35)';
  const parchment = 'var(--ornament-white, #e7dcc2)';
  const safeClass = value => String(value || '').replace(/[^a-zA-Z0-9_\-\s]/g, '');
  const petal = '<path d="M24 25C14 24 12 17 16 11C18 7 22 7 24 11C26 7 30 7 32 11C36 17 34 24 24 25Z"/>';
  const petals = (scale, offset, fill) => '<g fill="' + fill + '" transform="translate(24 24) scale(' + scale + ') translate(-24 -24)">' + [0, 72, 144, 216, 288].map(angle => '<g transform="rotate(' + (angle + offset) + ' 24 24)">' + petal + '</g>').join('') + '</g>';

  const shapes = {
    rose: petals(1, 0, wine) + petals(.57, 36, parchment) + '<circle cx="24" cy="24" r="3.1" fill="currentColor"/><circle cx="24" cy="24" r="1" fill="' + wine + '"/>',
    lily: '<path d="M24 40V22M24 28C17 19 15 12 24 5C33 12 31 19 24 28Z" fill="' + parchment + '"/><path d="M22 30C7 31 7 17 15 17C20 17 23 23 24 30M26 30C41 31 41 17 33 17C28 17 25 23 24 30"/><path d="M18 32H30M20 36H28M19 41L24 37L29 41"/>',
    crown: '<path d="M10 16L15 23L24 11L33 23L38 16L34 35H14Z" fill="' + wine + '"/><path d="M14 30H34M15 36H33M17 40H31M24 18V26"/><circle cx="9" cy="13" r="2"/><circle cx="24" cy="8" r="2"/><circle cx="39" cy="13" r="2"/><path d="M18 33H18.1M24 33H24.1M30 33H30.1" stroke-width="2.5"/>',
    sun: '<circle cx="24" cy="24" r="9" fill="' + parchment + '"/><circle cx="24" cy="24" r="5"/><path d="M24 4V11M24 37V44M4 24H11M37 24H44M10 10L15 15M33 33L38 38M10 38L15 33M33 15L38 10M16 5L18 12M30 36L32 43M5 16L12 18M36 30L43 32M5 32L12 30M36 18L43 16M16 43L18 36M30 12L32 5"/>',
    key: '<path d="M19 25L35 41M28 34L34 28M32 38L38 32M35 41L40 36"/><path d="M22 20C25 15 21 7 15 7C9 7 5 12 8 17C3 23 10 30 16 26C21 29 26 24 22 20Z" fill="' + parchment + '"/><circle cx="15" cy="17" r="3"/>',
    boar: '<path d="M7 29L5 24L11 21L13 14L20 17L26 14L34 18L38 25L43 27L42 32L35 34L32 40H28L29 33H20L18 40H14L14 32L9 32Z" fill="' + parchment + '"/><path d="M15 17L17 11L20 17M23 15L25 10L27 15M31 18L34 13L35 21M7 24L11 27M38 30L36 25M9 32C5 35 2 31 5 28"/><circle cx="34" cy="25" r="1.1" fill="currentColor"/><path d="M38 32L42 34L42 30"/>',
    feather: '<path d="M11 39C14 24 24 8 40 5C42 19 31 33 16 34Z" fill="' + parchment + '"/><path d="M7 43L34 12M16 32L16 24M20 27L28 28M24 22L24 15M28 17L35 17M12 39L20 35"/>',
    arrowLeft: '<path d="M40 24H8M19 14L8 24L19 34M33 20L37 24L33 28"/>',
    arrowRight: '<path d="M8 24H40M29 14L40 24L29 34M15 20L11 24L15 28"/>',
    close: '<path d="M13 13L35 35M35 13L13 35"/><path d="M10 17V10H17M31 10H38V17M38 31V38H31M17 38H10V31" stroke-width=".8"/>',
    sound: '<path d="M8 19H15L25 10V38L15 29H8Z" fill="' + parchment + '"/><path d="M31 17C35 21 35 27 31 31M36 11C43 18 43 30 36 37"/>',
    muted: '<path d="M8 19H15L25 10V38L15 29H8Z" fill="' + parchment + '"/><path d="M32 19L42 29M42 19L32 29"/>',
    expand: '<path d="M18 7H7V18M30 7H41V18M41 30V41H30M18 41H7V30M8 8L18 18M40 8L30 18M40 40L30 30M8 40L18 30"/>',
    bookmark: '<path d="M14 6H34V42L24 35L14 42Z" fill="' + wine + '"/><path d="M19 12H29M19 16H29M24 22L27 26L24 30L21 26Z"/>',
    seal: '<path d="M16 29L10 43L20 39L24 44L28 32M31 28L39 42L30 39L26 44" fill="' + wine + '"/><path d="M24 5L28 7L33 7L35 12L39 15L38 20L39 25L35 28L33 33H28L24 35L20 33H15L13 28L9 25L10 20L9 15L13 12L15 7H20Z" fill="' + wine + '"/><circle cx="24" cy="20" r="9"/><path d="M19 21L23 25L30 16"/>'
  };

  function icon(name, className = '') {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="ornament-icon ' + safeClass(className) + '" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (shapes[name] || shapes.rose) + '</svg>';
  }

  function rose(className = '') {
    const largePetal = '<path d="M160 133C124 133 108 104 117 77C122 59 142 48 160 64C178 48 198 59 203 77C212 104 196 133 160 133Z"/>';
    const red = [0, 72, 144, 216, 288].map((angle, index) => '<g class="rose-petal rose-red-petal petal-' + index + '" transform="rotate(' + angle + ' 160 126)">' + largePetal + '<path d="M160 126C148 110 139 84 143 68M160 126C172 110 181 84 177 68" fill="none" stroke-opacity=".45" stroke-width=".65"/></g>').join('');
    const white = [36, 108, 180, 252, 324].map((angle, index) => '<g class="rose-petal rose-white-petal petal-' + index + '" transform="rotate(' + angle + ' 160 126)"><path d="M160 130C141 130 133 114 138 99C142 89 151 84 160 93C169 84 178 89 182 99C187 114 179 130 160 130Z"/><path d="M160 126V99" fill="none" stroke-opacity=".4" stroke-width=".65"/></g>').join('');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 360" class="heraldic-rose ' + safeClass(className) + '" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      '<g class="rose-frame" opacity=".52"><path d="M37 141C37 73 92 20 160 20C228 20 283 73 283 141" stroke-width=".65"/><path d="M44 141C44 77 96 27 160 27C224 27 276 77 276 141" stroke-width=".45"/><path d="M37 154V178M283 154V178M32 166H42M278 166H288M153 13H167M160 6V20"/><path d="M57 290L63 284L69 290L63 296Z M251 290L257 284L263 290L257 296Z"/><path d="M88 326H140M180 326H232M153 326L160 319L167 326L160 333Z"/></g>' +
      '<g class="stem rose-stem"><path d="M160 169C151 207 169 247 157 318" stroke-width="2"/><path d="M159 242C139 232 123 217 112 201M161 271C183 261 199 244 211 227"/><path d="M158 240C130 241 105 227 104 199C131 202 151 218 158 240Z" fill="' + wine + '"/><path d="M162 268C186 270 210 252 215 222C188 227 167 244 162 268Z" fill="' + wine + '"/><path d="M111 205L149 234M209 229L171 261M124 217V228M134 224V235M197 241L198 253M186 250L187 262" stroke-width=".7"/><path d="M160 211L169 203L160 204M160 289L150 281L159 283" fill="currentColor"/><path d="M140 173L160 194L179 171L160 181Z" fill="' + wine + '"/></g>' +
      '<g class="petals-red rose-petals-red" fill="' + wine + '">' + red + '</g>' +
      '<g class="petals-white rose-petals-white" fill="' + parchment + '">' + white + '</g>' +
      '<g class="rose-heart"><circle cx="160" cy="126" r="12" fill="' + wine + '"/><circle cx="160" cy="126" r="8" stroke-dasharray="1 3"/><circle cx="160" cy="126" r="4.3" fill="currentColor"/><path d="M160 110V114M160 138V142M144 126H148M172 126H176"/></g>' +
      '<g class="bud rose-bud" opacity="0"><path d="M160 174C137 158 139 132 160 117C181 132 183 158 160 174Z" fill="' + wine + '"/><path d="M160 171C160 148 149 137 149 137M160 171C160 148 171 137 171 137"/><path d="M148 165L160 177L172 165" fill="' + parchment + '"/></g>' +
      '<g class="falling-petal rose-falling-petal" opacity="0" fill="' + wine + '"><path d="M206 177C211 159 230 157 232 174C235 187 219 202 205 206C211 196 201 189 206 177Z"/></g>' +
      '<g class="falling-petal falling-petal-white rose-falling-petal-white" opacity="0" fill="' + parchment + '"><path d="M102 189C95 174 82 178 83 192C83 205 96 211 105 220C101 208 109 201 102 189Z"/></g>' +
      '</svg>';
  }

  window.Ornaments = Object.freeze({ icon, rose, names: Object.freeze(Object.keys(shapes)) });
})();
