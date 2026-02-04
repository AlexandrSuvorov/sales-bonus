/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */

//процент бонуса для продавцов 
const topSellerBonus = 0.15; // Бонус лидеру (15%)
const secondThirdSellerBonus = 0.1; // Бонус 2-3 места (10%)
const sellerBonus = 0.05; // Бонус остальных (5%)
const worstSellerBonus = 0; // Бонус последнего (0%)

function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  const { discount, sale_price, quantity } = purchase;
  // Учитываем скидку: 1 - (discount/100)
  const discountRevenue = 1 - discount / 100;
  const revenue = sale_price * quantity * discountRevenue;
  return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */

function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  const { profit } = seller;

  if (index === 0) {
    return +(profit * topSellerBonus).toFixed(2); //Расчет бонуса лучшему продавцу
  } else if (index === 1 || index === 2) {
    return +(profit * secondThirdSellerBonus).toFixed(2); //Расчет бонуса второму и третьему продавцу по показаниям
  } else if (index === total - 1) {
    return 0; //Расчет бонуса худшего продавца
  } else {
    return +(profit * sellerBonus).toFixed(2); //Расчет бонуса остальным продавцам
  }
}
/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */

function analyzeSalesData(data, options) {
  const { calculateRevenue, calculateBonus } = options;

  // @TODO: Проверка входных данных
  // Проверяем наличие обязательных коллекций 
  // Проверка наличия данных в коллекциях
  if (!Array.isArray(data.sellers) || data.sellers.length === 0) {
    throw new Error("Некорректные входные данные коллекции 'sellers'");
  }
  if (!Array.isArray(data.products) || data.products.length === 0) {
    throw new Error("Некорректные входные данные коллекции 'products'");
  }
  if (
    !Array.isArray(data.purchase_records) ||
    data.purchase_records.length === 0
  ) {
    throw new Error("Некорректные входные данные коллекции 'purchase_records'");
  }

  // @TODO: Проверка наличия опций
  if (!typeof calculateRevenue === "function" || !typeof options === "object") {
    throw new Error("Чего-то не хватает");
  }

  // @TODO: Подготовка промежуточных данных для сбора статистики
  const sellerStats = data.sellers.map((seller) => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
  }));

  // @TODO: Индексация продавцов и товаров для быстрого доступа
  const sellerIndex = Object.fromEntries(
    sellerStats.map((seller) => [seller.id, seller]),
  );

  const productIndex = Object.fromEntries(
    data.products.map((product) => [product.sku, product]),
  );

  // @TODO: Расчет выручки и прибыли для каждого продавца
  data.purchase_records.forEach((record) => {
    const seller = sellerIndex[record.seller_id];

    seller.sales_count++;//считаем продажи

    seller.revenue += record.total_amount;//суммируем выручку

    record.items.forEach((item) => {
      //считаем себестоимость и прибыль
      const product = productIndex[item.sku];
      const cost = product.purchase_price * item.quantity;
      const revenue = calculateRevenue(item);
      const profit = revenue - cost;
      seller.profit += profit;

      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }

      seller.products_sold[item.sku] += item.quantity;
    });
  });

  // @TODO: Сортировка продавцов по прибыли
  sellerStats.sort((a, b) => b.profit - a.profit);

  // @TODO: Назначение премий на основе ранжирования
  sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, sellerStats.length, seller); //считаем бонус
    seller.top_products = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями
  return sellerStats.map((seller) => ({
    seller_id: String(seller.id),
    name: String(seller.name),
    revenue: Number(seller.revenue.toFixed(2)),
    profit: Number(seller.profit.toFixed(2)),
    sales_count: Number(seller.sales_count),
    top_products: seller.top_products,
    bonus: seller.bonus, 
  }));
}
