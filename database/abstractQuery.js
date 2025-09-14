export async function abstractQ(data, object) {
    const {fetchApi, method}=object
       try {
        const response = await fetch(`${url}${fetchApi}`, {
            method: method,
            headers:{
                'Content-Type':'application/json'
            },
            body: JSON.stringify(data)
        })

        const results = await response.json()
        if(results.error || results.err) return {error: results.error|| results.err}

        return {message:results.message}
    } catch (error) {
        console.log(error)
        return {error:'Server error'}
    }
}