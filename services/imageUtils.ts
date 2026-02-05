
/**
 * Utilitário para adicionar marca d'água (Timestamp e Geolocalização) em imagens
 * Reposicionado para o Canto Superior Direito.
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
      
      // Configuração global de alinhamento à DIREITA
      ctx.textAlign = 'right';

      // 1. Camada de Contraste (Gradiente Superior Direito)
      // Protege a leitura em fotos de céu claro ou fundos brancos
      const overlayHeight = 450 * scale;
      const overlayWidth = 600 * scale;
      const gradient = ctx.createLinearGradient(TARGET_WIDTH, 0, TARGET_WIDTH - overlayWidth, overlayHeight);
      gradient.addColorStop(0, 'rgba(0,0,0,0.85)');
      gradient.addColorStop(0.7, 'rgba(0,0,0,0.3)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      
      // Desenha o fundo apenas na área do selo
      ctx.fillRect(TARGET_WIDTH - overlayWidth, 0, overlayWidth, overlayHeight);

      // 2. RELÓGIO (Topo)
      const timeStr = data.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      ctx.fillStyle = 'white';
      ctx.font = `bold ${100 * scale}px "Inter", sans-serif`;
      ctx.textBaseline = 'top';
      
      const mainY = safeMargin;
      ctx.fillText(timeStr, TARGET_WIDTH - safeMargin, mainY);
      const timeMetrics = ctx.measureText(timeStr);

      // 3. BARRA SEPARADORA (Vertical à esquerda do tempo)
      const barX = TARGET_WIDTH - safeMargin - timeMetrics.width - (25 * scale);
      const barY = mainY + (10 * scale);
      const barHeight = 85 * scale;
      ctx.fillStyle = '#facc15'; 
      ctx.fillRect(barX, barY, 4.5 * scale, barHeight);

      // 4. DATA E DIA (Alinhado à direita, encostado na barra)
      ctx.fillStyle = 'white';
      ctx.font = `bold ${32 * scale}px "Inter", sans-serif`;
      ctx.textAlign = 'right';
      const dateStr = data.date.toLocaleDateString('pt-BR');
      const dayName = data.date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', '');
      
      // Usamos a posição da barra como referência de limite esquerdo
      ctx.fillText(dateStr, barX - (15 * scale), barY + (10 * scale));
      ctx.fillText(dayName, barX - (15 * scale), barY + (50 * scale));

      // 5. ENDEREÇO ABREVIADO (Abaixo do tempo)
      // Resetamos alinhamento para direita total na margem de segurança
      ctx.textAlign = 'right';
      let displayAddress = data.address;
      if (displayAddress.length > 80) {
        const parts = displayAddress.split(',');
        if (parts.length > 3) {
           displayAddress = parts.slice(0, 3).join(',').trim();
        } else {
           displayAddress = displayAddress.substring(0, 77) + '...';
        }
      }

      ctx.font = `500 ${26 * scale}px "Inter", sans-serif`;
      const maxWidth = 500 * scale; // Largura máxima do bloco de texto lateral
      const wrappedLines = wrapText(ctx, displayAddress, maxWidth);
      
      let currentAddressY = mainY + (120 * scale);
      wrappedLines.slice(0, 3).forEach((line) => {
        ctx.fillText(line, TARGET_WIDTH - safeMargin, currentAddressY);
        currentAddressY += 34 * scale;
      });

      // 6. TÉCNICO E GPS (Linha final do bloco superior)
      ctx.font = `bold ${22 * scale}px "Inter", sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      
      const techText = `Vistoria: ${data.userName}`;
      const gpsText = `GPS: ${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`;
      
      ctx.fillText(techText, TARGET_WIDTH - safeMargin, currentAddressY + (15 * scale));
      ctx.fillText(gpsText, TARGET_WIDTH - safeMargin, currentAddressY + (45 * scale));

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
