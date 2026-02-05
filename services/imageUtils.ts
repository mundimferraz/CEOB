
/**
 * Utilitário para adicionar marca d'água (Timestamp e Geolocalização) em imagens
 * Otimizado para legibilidade máxima, respeitando margens e resumindo endereços longos.
 */

interface WatermarkData {
  address: string;
  lat: number;
  lng: number;
  userName: string;
  date: Date;
}

export const addWatermarkToImage = (
  base64Image: string,
  data: WatermarkData
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Não foi possível obter o contexto do canvas'));
        return;
      }

      const TARGET_WIDTH = Math.min(img.width, 1920);
      const ratio = TARGET_WIDTH / img.width;
      const TARGET_HEIGHT = img.height * ratio;

      canvas.width = TARGET_WIDTH;
      canvas.height = TARGET_HEIGHT;

      ctx.drawImage(img, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);

      const scale = TARGET_WIDTH / 1000;
      const safeMargin = 50 * scale; 

      // 1. Camada de Contraste (Gradiente Inferior mais robusto)
      const overlayHeight = 420 * scale;
      const gradient = ctx.createLinearGradient(0, TARGET_HEIGHT, 0, TARGET_HEIGHT - overlayHeight);
      gradient.addColorStop(0, 'rgba(0,0,0,0.9)');
      gradient.addColorStop(0.6, 'rgba(0,0,0,0.4)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, TARGET_HEIGHT - overlayHeight, TARGET_WIDTH, overlayHeight);

      // 2. RELÓGIO
      const timeStr = data.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      ctx.fillStyle = 'white';
      ctx.font = `bold ${115 * scale}px "Inter", sans-serif`;
      ctx.textBaseline = 'bottom';
      const timeWidth = ctx.measureText(timeStr).width;
      const mainY = TARGET_HEIGHT - (safeMargin + 140 * scale);
      ctx.fillText(timeStr, safeMargin, mainY);

      // 3. BARRA SEPARADORA
      const barX = safeMargin + timeWidth + (25 * scale);
      const barY = mainY - (100 * scale);
      const barHeight = 95 * scale;
      ctx.fillStyle = '#facc15'; 
      ctx.fillRect(barX, barY, 4.5 * scale, barHeight);

      // 4. DATA E DIA
      ctx.fillStyle = 'white';
      ctx.font = `bold ${36 * scale}px "Inter", sans-serif`;
      const dateStr = data.date.toLocaleDateString('pt-BR');
      const dayName = data.date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', '');
      ctx.fillText(dateStr, barX + (25 * scale), barY + (40 * scale));
      ctx.fillText(dayName, barX + (25 * scale), barY + (90 * scale));

      // 5. ENDEREÇO ABREVIADO
      // Lógica de abreviação para economizar espaço
      let displayAddress = data.address;
      if (displayAddress.length > 80) {
        const parts = displayAddress.split(',');
        // Prioriza as partes fundamentais: Rua, Número e Bairro
        if (parts.length > 3) {
           displayAddress = parts.slice(0, 3).join(',').trim();
        } else {
           displayAddress = displayAddress.substring(0, 77) + '...';
        }
      }

      ctx.font = `500 ${30 * scale}px "Inter", sans-serif`;
      const maxWidth = TARGET_WIDTH - (safeMargin * 2);
      const wrappedLines = wrapText(ctx, displayAddress, maxWidth);
      
      let currentAddressY = mainY + (50 * scale);
      wrappedLines.slice(0, 2).forEach((line) => {
        ctx.fillText(line, safeMargin, currentAddressY);
        currentAddressY += 38 * scale;
      });

      // 6. TÉCNICO E GPS (Rodapé final)
      ctx.font = `bold ${24 * scale}px "Inter", sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      const techText = `Vistoriador: ${data.userName}`;
      const gpsText = `GPS: ${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`;
      
      ctx.fillText(techText, safeMargin, TARGET_HEIGHT - safeMargin);
      const gpsWidth = ctx.measureText(gpsText).width;
      ctx.fillText(gpsText, TARGET_WIDTH - safeMargin - gpsWidth, TARGET_HEIGHT - safeMargin);

      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };

    img.onerror = () => reject(new Error('Erro no carregamento da imagem'));
    img.src = base64Image;
  });
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}
