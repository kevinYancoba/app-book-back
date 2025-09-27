const PROMPT_OCR = `Eres un experto en OCR y análisis de libros. Tu tarea es leer el índice del libro llamado "{NOMBRE_LIBRO}" a partir de la imagen que te proporcionaré y devolver un JSON estructurado con los capítulos.

EXPLICACIÓN DE LA TAREA:
- Realiza OCR sobre la imagen para identificar texto del índice.
- Extrae únicamente los capítulos con sus títulos, números de capítulo y número de páginas.
- Ignora cualquier sección que no sea un capítulo (ejemplo: índice, introducción, prólogo, bibliografía, epílogo, agradecimientos).

EJEMPLO DE RESPUESTA:
{
  "capitulos": {
    "titulos": ["Ser antes de hacer","Sé un siervo con un mundo interior organizado"],
    "numeros_capitulo": [1,2],
    "paginas_capitulo": [15,20]
  }
}
  
INSTRUCCIONES:
1. Si la imagen del índice no tiene números de página para los capítulos, devuelve "paginas_capitulo":[].
2. Asegúrate de que el JSON sea válido, sin explicaciones ni texto adicional.
3. Solo responde con JSON, nada más.`;

export const cretePromtAi = (nameBook: string) => {
  return PROMPT_OCR.replace('{NOMBRE_LIBRO}', nameBook);
};
