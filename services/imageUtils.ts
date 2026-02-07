
/**
 * Utilitário para adicionar marca d'água (Timestamp e Geolocalização) em imagens
 * Reposicionado para a parte inferior seguindo o padrão "GPS Map Camera".
 * Margens de 2cm (aprox. 7.5% da largura) conforme solicitado.
 */

interface WatermarkData {
  address: string;
  lat: number;
  lng: number;
  userName: string;
  date: Date;
}

/**
 * Desenha um retângulo com cantos arredondados compatível com navegadores antigos
 */
function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export const addWatermarkToImage = (
  base64Image: string,
  data: WatermarkData
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Importante: remover crossOrigin se for base64 local para evitar problemas de segurança em alguns browsers
    if (!base64Image.startsWith('data:')) {
      img.crossOrigin = "anonymous";
    }
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        reject(new Error('Não foi possível obter o contexto do canvas'));
        return;
      }

      // Redimensionamento inteligente para manter performance e nitidez
      const TARGET_WIDTH = Math.min(img.width, 1600); 
      const ratio = TARGET_WIDTH / img.width;
      const TARGET_HEIGHT = img.height * ratio;

      canvas.width = TARGET_WIDTH;
      canvas.height = TARGET_HEIGHT;

      // Desenha a imagem base
      ctx.drawImage(img, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);

      // Fator de escala baseado na largura
      const scale = TARGET_WIDTH / 1000;
      
      // Margens de 2cm aproximadas (7.5% da largura do canvas)
      const marginX = TARGET_WIDTH * 0.065; 
      const marginY = TARGET_WIDTH * 0.065; 

      // 1. Painel de Fundo (Ajustado para 0.60 de opacidade)
      const panelWidth = TARGET_WIDTH - (marginX * 2);
      const panelHeight = 210 * scale;
      const panelX = marginX;
      const panelY = TARGET_HEIGHT - marginY - panelHeight;

      drawRoundedRect(ctx, panelX, panelY, panelWidth, panelHeight, 18 * scale);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.60)';
      ctx.fill();
      
      // Borda do painel
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1 * scale;
      ctx.stroke();

      const textPadding = 25 * scale;
      const startX = panelX + textPadding;
      const startY = panelY + textPadding;

      // 2. TÍTULO (Logradouro Principal)
      const addressParts = data.address.split(',');
      const locationTitle = addressParts[0] || "Vistoria Identificada";
      
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${32 * scale}px "Inter", sans-serif, system-ui`;
      ctx.fillText(locationTitle, startX, startY);

      // 3. ENDEREÇO DETALHADO
      ctx.font = `500 ${21 * scale}px "Inter", sans-serif, system-ui`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      
      const fullAddress = addressParts.slice(1).join(',').trim() || data.address;
      // Ajustado maxTextWidth para ocupar o painel todo agora que não tem logo
      const maxTextWidth = panelWidth - (textPadding * 2);
      const wrappedLines = wrapText(ctx, fullAddress, maxTextWidth);
      
      let currentY = startY + (42 * scale);
      wrappedLines.slice(0, 2).forEach(line => {
        ctx.fillText(line, startX, currentY);
        currentY += 26 * scale;
      });

      // 4. DATA E HORA
      const dateStr = data.date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = data.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      ctx.font = `500 ${19 * scale}px "Inter", sans-serif, system-ui`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fillText(`${dateStr}  ${timeStr}`, startX, panelY + panelHeight - (textPadding + 32 * scale));

      // 5. RODAPÉ (Técnico e GPS)
      const footerText = `Resp: ${data.userName}  |  GPS: ${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`;
      ctx.font = `bold ${18 * scale}px "Inter", sans-serif, system-ui`;
      ctx.fillStyle = '#facc15'; 
      ctx.fillText(footerText, startX, panelY + panelHeight - textPadding);

      // Retorna a imagem finalizada
      resolve(canvas.toDataURL('image/jpeg', 0.88));
    };

    img.onerror = () => {
      console.error("Erro ao carregar imagem para marca d'água");
      reject(new Error('Erro no carregamento da imagem original'));
    };

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
