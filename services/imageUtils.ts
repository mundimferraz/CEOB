
/**
 * Utilitário para adicionar marca d'água (Timestamp e Geolocalização) em imagens
 * Otimizado para evitar cortes e garantir legibilidade em qualquer resolução.
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

      // Mantém a proporção original, mas limita para um tamanho gerenciável se for muito grande
      const MAX_WIDTH = 1920;
      let targetWidth = img.width;
      let targetHeight = img.height;

      if (img.width > MAX_WIDTH) {
        const ratio = MAX_WIDTH / img.width;
        targetWidth = MAX_WIDTH;
        targetHeight = img.height * ratio;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Desenha a imagem
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Fator de escala dinâmico baseado na largura final
      const scale = targetWidth / 1000;
      const padding = 40 * scale;

      // 1. Fundo escuro semi-transparente para contraste total
      // Criamos um retângulo com degradê no canto inferior esquerdo
      const boxHeight = 350 * scale;
      const gradient = ctx.createLinearGradient(0, targetHeight, 0, targetHeight - boxHeight);
      gradient.addColorStop(0, 'rgba(0,0,0,0.8)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, targetHeight - boxHeight, targetWidth, boxHeight);

      // 2. Renderização da HORA (Grande, Estilo Digital)
      const timeStr = data.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      ctx.fillStyle = 'white';
      ctx.font = `bold ${100 * scale}px sans-serif`;
      ctx.textBaseline = 'top';
      const timeMetrics = ctx.measureText(timeStr);
      const timeY = targetHeight - (padding + 220 * scale);
      ctx.fillText(timeStr, padding, timeY);

      // 3. BARRA AMARELA SEPARADORA
      const barX = padding + timeMetrics.width + (25 * scale);
      const barY = timeY + (10 * scale);
      const barHeight = 85 * scale;
      ctx.fillStyle = '#facc15'; // Amarelo vibrante
      ctx.fillRect(barX, barY, 5 * scale, barHeight);

      // 4. DATA E DIA (Lado da barra)
      ctx.fillStyle = 'white';
      ctx.font = `bold ${32 * scale}px sans-serif`;
      const dateStr = data.date.toLocaleDateString('pt-BR');
      const dayOfWeek = data.date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', '');
      
      ctx.fillText(dateStr, barX + (20 * scale), barY);
      ctx.fillText(dayOfWeek, barX + (20 * scale), barY + (45 * scale));

      // 5. ENDEREÇO (Resumido e com quebra)
      ctx.font = `500 ${26 * scale}px sans-serif`;
      // Resumo básico: se o endereço for gigante (coordenadas repetidas etc), cortamos
      const cleanAddress = data.address.length > 120 ? data.address.substring(0, 117) + '...' : data.address;
      
      const maxWidth = targetWidth - (padding * 2);
      const addressLines = wrapText(ctx, cleanAddress, maxWidth);
      
      // Limitamos a 2 linhas de endereço para não poluir
      const displayLines = addressLines.slice(0, 2);
      let currentY = targetHeight - (padding + 90 * scale);
      
      displayLines.forEach((line, idx) => {
        const text = idx === 1 && addressLines.length > 2 ? line + '...' : line;
        ctx.fillText(text, padding, currentY);
        currentY += 35 * scale;
      });

      // 6. RODAPÉ (Técnico e Coordenadas)
      ctx.font = `bold ${22 * scale}px sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      const footerText = `Nota: Responsável Técnico / ${data.userName}`;
      const gpsText = `LAT: ${data.lat.toFixed(6)} LNG: ${data.lng.toFixed(6)}`;
      
      ctx.fillText(footerText, padding, targetHeight - (padding + 10 * scale));
      
      // GPS no canto direito
      const gpsWidth = ctx.measureText(gpsText).width;
      ctx.fillText(gpsText, targetWidth - padding - gpsWidth, targetHeight - (padding + 10 * scale));

      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };

    img.onerror = () => reject(new Error('Erro ao carregar imagem para marca d\'água'));
    img.src = base64Image;
  });
};

/**
 * Função auxiliar para quebra de texto inteligente
 */
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
