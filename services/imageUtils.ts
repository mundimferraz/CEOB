
/**
 * Utilitário para adicionar marca d'água (Timestamp e Geolocalização) em imagens
 * Reposicionado para a parte inferior seguindo o padrão "GPS Map Camera".
 * Margens aproximadas de 2cm (proporcionais à resolução).
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

      // Define a resolução alvo (máximo 1920px de largura)
      const TARGET_WIDTH = Math.min(img.width, 1920);
      const ratio = TARGET_WIDTH / img.width;
      const TARGET_HEIGHT = img.height * ratio;

      canvas.width = TARGET_WIDTH;
      canvas.height = TARGET_HEIGHT;

      // Desenha a imagem original
      ctx.drawImage(img, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);

      // Fator de escala baseado na largura (1000px como base unitária)
      const scale = TARGET_WIDTH / 1000;
      
      // Margens de "2cm" convertidas para escala (aprox 75px em 1000px de largura)
      const marginX = 60 * scale; 
      const marginY = 60 * scale; 

      // 1. Painel de Fundo (Translúcido Escuro)
      // O painel ocupa a largura entre as margens laterais
      const panelWidth = TARGET_WIDTH - (marginX * 2);
      const panelHeight = 220 * scale;
      const panelX = marginX;
      const panelY = TARGET_HEIGHT - marginY - panelHeight;

      // Desenha o box com cantos levemente arredondados
      ctx.beginPath();
      ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 20 * scale);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fill();
      
      // Borda decorativa (opcional, estilo premium)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1 * scale;
      ctx.stroke();

      const textPadding = 25 * scale;
      const startX = panelX + textPadding;
      const startY = panelY + textPadding;

      // 2. TÍTULO DO LOCAL (Negrito)
      const addressParts = data.address.split(',');
      const locationTitle = addressParts[0] || "Localização Identificada";
      
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${32 * scale}px "Inter", sans-serif`;
      ctx.fillText(locationTitle, startX, startY);

      // 3. ENDEREÇO COMPLETO (Corpo)
      ctx.font = `500 ${22 * scale}px "Inter", sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      
      const fullAddress = addressParts.slice(1).join(',').trim() || data.address;
      const maxTextWidth = panelWidth - (textPadding * 2) - (150 * scale); // Reserva espaço para o "box" da direita se houver
      const wrappedAddress = wrapText(ctx, fullAddress, maxTextWidth);
      
      let currentY = startY + (45 * scale);
      wrappedAddress.slice(0, 2).forEach(line => {
        ctx.fillText(line, startX, currentY);
        currentY += 28 * scale;
      });

      // 4. DATA, HORA E GPS (Linha Inferior)
      const dateStr = data.date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = data.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const footerInfo = `${dateStr}  ${timeStr}`;
      
      ctx.font = `500 ${20 * scale}px "Inter", sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(footerInfo, startX, panelY + panelHeight - (textPadding + 35 * scale));

      // 5. NOTA / TÉCNICO E GPS
      const noteInfo = `Nota: ${data.userName} | GPS: ${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`;
      ctx.font = `bold ${18 * scale}px "Inter", sans-serif`;
      ctx.fillStyle = '#facc15'; // Amarelo destaque
      ctx.fillText(noteInfo, startX, panelY + panelHeight - textPadding);

      // 6. BOX DE LOGO / ICONE (Lado Direito do Painel)
      const logoBoxSize = 120 * scale;
      const logoBoxX = panelX + panelWidth - logoBoxSize - textPadding;
      const logoBoxY = panelY + (panelHeight - logoBoxSize) / 2;

      ctx.beginPath();
      ctx.roundRect(logoBoxX, logoBoxY, logoBoxSize, logoBoxSize, 12 * scale);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fill();
      
      // Borda do box do logo
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3 * scale;
      ctx.stroke();

      // Placeholder de Ícone no Box (SGR)
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#0f172a';
      ctx.font = `bold ${40 * scale}px "Inter", sans-serif`;
      ctx.fillText("SGR", logoBoxX + logoBoxSize/2, logoBoxY + logoBoxSize/2);

      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };

    img.onerror = () => reject(new Error('Erro no processamento da imagem'));
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
