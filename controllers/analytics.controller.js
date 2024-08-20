const mongoose = require('mongoose');

// Helper function for MongoDB Aggregation
const aggregateData = async (collection, pipeline) => {
    return mongoose.connection.collection(collection).aggregate(pipeline).toArray();
};

// Controller to get Total Sales Over Time
exports.getTotalSalesOverTime = async (req, res) => {
    try {

        const pipeline = [
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$created_at" } }
                    },
                    totalSales: { $sum: { $toDouble: "$total_price_set.shop_money.amount" } }
                }
            },
            { $sort: { _id: 1 } } // Sort by date (ascending)
        ];

        // Execute the aggregation
        const result = await mongoose.connection.collection('shopifyOrders').aggregate(pipeline).toArray();
       // console.log("total sales:- ",result)

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



// Controller to get Sales Growth Rate Over Time
exports.getSalesGrowthRate = async (req, res) => {
    try {
      
        const pipeline = [
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: { $toDate: "$created_at" } } },
                    totalSales: { $sum: { $toDouble: "$total_price_set.shop_money.amount" } }
                }
            },
            { $sort: { _id: 1 } } // Sort by month
        ];

        const salesData = await mongoose.connection.collection('shopifyOrders').aggregate(pipeline).toArray();

        // Calculate growth rates
        const growthRates = salesData.map((item, index, array) => {
            if (index === 0) return { month: item._id, growthRate: null };
            const previousSales = array[index - 1].totalSales;
            const growthRate = previousSales ? ((item.totalSales - previousSales) / previousSales) * 100 : null;
            return { month: item._id, growthRate };
        });
       // console.log("groeth rates:-",growthRates)
        res.json(growthRates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Controller to get New Customers Added Over Time
exports.getNewCustomersOverTime = async (req, res) => {
    try {
        
        const pipeline = [
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$created_at" } } },
                    newCustomers: { $count: {} } // Count new customers per day
                }
            },
            { $sort: { _id: 1 } } // Sort by day
        ];

        // Execute the aggregation
        const result = await mongoose.connection.collection('shopifyCustomers').aggregate(pipeline).toArray();
        //console.log("new customer:-",result);
    
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Controller to get Number of Repeat Customers
exports.getRepeatCustomers = async (req, res) => {
    try {
        const pipeline = [
            {
                $group: {
                    _id: "$customer.id",
                    orderCount: { $sum: 1 }
                }
            },
            {
                $match: {
                    orderCount: { $gt: 1 }
                }
            }
        ];

        const result = await aggregateData('shopifyOrders', pipeline);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Controller to get Geographical Distribution of Customers
exports.getGeographicalDistribution = async (req, res) => {
    try {
        const pipeline = [
            {
                $group: {
                    _id: "$default_address.city",
                    customerCount: { $sum: 1 }
                }
            },
            { $sort: { customerCount: -1 } }
        ];

        const result = await aggregateData('shopifyCustomers', pipeline);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Controller to get Customer Lifetime Value by Cohorts
exports.getCustomerLifetimeValueByCohorts = async (req, res) => {
    try {

        const pipeline = [
            {
                $addFields: {
                    createdAtDate: { $toDate: "$created_at" }, // Convert created_at to Date
                    firstPurchaseMonth: {
                        $dateToString: { format: "%Y-%m", date: { $toDate: "$created_at" } } // Format date as YYYY-MM
                    }
                }
            },
            {
                $lookup: {
                    from: 'shopifyOrders',
                    localField: '_id',
                    foreignField: 'customer_id',
                    as: 'orders'
                }
            },
            {
                $addFields: {
                    totalLifetimeValue: {
                        $sum: {
                            $map: {
                                input: "$orders",
                                as: "order",
                                in: { $toDouble: "$$order.total_price_set.shop_money.amount" } // Convert amount to numeric
                            }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$firstPurchaseMonth",
                    cohorts: { $push: { customerId: "$_id", lifetimeValue: "$totalLifetimeValue" } },
                    totalLifetimeValueByCohort: { $sum: "$totalLifetimeValue" }
                }
            },
            { $sort: { _id: 1 } } // Sort by cohort month
        ];

        const result = await mongoose.connection.collection('shopifyCustomers').aggregate(pipeline).toArray();

        // console.log('Customer Lifetime Value by Cohorts:', result);

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
