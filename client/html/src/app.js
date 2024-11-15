window.paypal
    .Buttons({
        style: {
            shape: "rect",
            layout: "vertical",
            color: "gold",
            label: "paypal",
        },

        async createOrder() {
            try {
                const response = await fetch("/api/orders", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        cart: [
                            {
                                id: "some_random_item_id",
                                quantity: quantity1.value,
                                price: (quantity1.value * 10.00).toString()
                            },
                        ]
                    }),
                });

                const orderData = await response.json();
                if (orderData.id) {
                    return orderData.id;
                }
                const errorDetail = orderData?.details?.[0];
                const errorMessage = errorDetail
                    ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
                    : JSON.stringify(orderData);

                throw new Error(errorMessage);
            } catch (error) {
            }
        },

        async onApprove(data, actions) {
            try {
                const response = await fetch(
                    `/api/orders/${data.orderID}/capture`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );

                const orderData = await response.json();
                const errorDetail = orderData?.details?.[0];

                if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
                    return actions.restart();
                } else if (errorDetail) {
                    throw new Error(
                        `${errorDetail.description} (${orderData.debug_id})`
                    );
                } else if (!orderData.purchase_units) {
                    throw new Error(JSON.stringify(orderData));
                } else {
                    const transaction =
                        orderData?.purchase_units?.[0]?.payments
                            ?.captures?.[0] ||
                        orderData?.purchase_units?.[0]?.payments
                            ?.authorizations?.[0];
                    console.log(
                        "Capture result",
                        orderData,
                        JSON.stringify(orderData, null, 2)
                    );
                    showTransactionModal(transaction.id);
                }
            } catch (error) {
                console.error(error);
            }
        },
    })
    .render("#paypal-button-container");

function updatePrice() {
    document.getElementById('cartValue').innerHTML = "Total: $" + quantity1.value * 10.00;
}
var transactionID;
function showTransactionModal(transID) {
    document.getElementById('transactionID').innerHTML = transID;
    var modal = document.getElementById("myModal");
    modal.style.display = "flex";
    transactionID = transID;
    alert("Payment completed");
}

document.getElementById("refund-btn").onclick = async function () {
    const response = await fetch(
        `/api/payments/${transactionID}/refund`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );
    const refundData = await response.json();
    console.log(refundData, "REFUND DATA");
    if(refundData.status == "COMPLETED"){
        alert("Your refund has been completed.");
    } else {
        alert("Your refund has failed.");
    }
    var modal = document.getElementById("myModal");
    modal.style.display = "none";
}