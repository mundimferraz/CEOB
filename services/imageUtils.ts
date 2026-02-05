
/**
 * Utilitário para adicionar marca d'água (Timestamp e Geolocalização) em imagens
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
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Não foi possível obter o contexto do canvas'));
        return;
      }

      // Define o tamanho do canvas igual ao da imagem original
      canvas.width = img.width;
      canvas.height = img.height;

      // Desenha a imagem original
      ctx.drawImage(img, 0, 0);

      // Configurações de escala baseadas no tamanho da imagem (para manter proporção em fotos HD)
      const scale = canvas.width / 1000; 
      const padding = 30 * scale;

      // 1. Sombra/Gradiente no rodapé para legibilidade
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - (300 * scale));
      gradient.addColorStop(0, 'rgba(0,0,0,0.7)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, canvas.height - (300 * scale), canvas.width, 300 * scale);

      // 2. Desenhar a HORA (Grande)
      const timeStr = data.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      ctx.fillStyle = 'white';
      ctx.font = `bold ${80 * scale}px Inter, sans-serif`;
      ctx.textBaseline = 'bottom';
      ctx.fillText(timeStr, padding, canvas.height - (padding + 140 * scale));

      // 3. Desenhar DATA e DIA DA SEMANA
      const dayOfWeek = data.date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      const dateStr = data.date.toLocaleDateString('pt-BR');
      ctx.font = `bold ${28 * scale}px Inter, sans-serif`;
      
      // Linha vertical separadora (amarela como na imagem de referência)
      ctx.fillStyle = '#facc15';
      ctx.fillRect(padding + (240 * scale), canvas.height - (padding + 225 * scale), 4 * scale, 80 * scale);

      ctx.fillStyle = 'white';
      ctx.fillText(dateStr, padding + (260 * scale), canvas.height - (padding + 185 * scale));
      ctx.fillText(dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1), padding + (260 * scale), canvas.height - (padding + 145 * scale));

      // 4. Desenhar ENDEREÇO (Quebra de linha se necessário)
      ctx.font = `${22 * scale}px Inter, sans-serif`;
      const maxWidth = canvas.width - (padding * 2);
      const addressLines = wrapText(ctx, data.address, maxWidth);
      
      let currentY = canvas.height - (padding + 80 * scale);
      addressLines.forEach(line => {
        ctx.fillText(line, padding, currentY);
        currentY += 30 * scale;
      });

      // 5. Desenhar TÉCNICO E COORDENADAS
      ctx.font = `bold ${20 * scale}px Inter, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      const footerText = `Técnico: ${data.userName} | GPS: ${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`;
      ctx.fillText(footerText, padding, canvas.height - padding);

      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };

    img.onerror = () => reject(new Error('Erro ao carregar imagem para processamento'));
    img.src = base64Image;
  });
};

// Função auxiliar para quebra de texto
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
